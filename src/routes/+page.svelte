<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import family from '$lib/images/mother_childv2.png';
	import grandfather from '$lib/images/grandfather.png';
	import bannerImg1 from '$lib/images/banner-2.png';
	import * as yup from 'yup';
	import dayjs from 'dayjs';

	import { Popover, Modal, Spinner, Datepicker } from 'flowbite-svelte';
	import { Indicator } from 'flowbite-svelte';
	import { saveLead, type LeadPayload } from './page';
	let defaultModal = false,
		showError = false,
		errorMsg = '';

	const guide = 'Choose your convenient date and time and we will contact you';

	const plans = [
		// 'Plan A (Life Protection only)',
		'Build My Plan',
		'Plan B (Life Protection with critical illness cover)'
	];
	const options = ['Yes', 'No'];
	const genderOptions = ['Female', 'Male'];
	const bandSize = 6,
		minAge = 18,
		maxAge = 60,
		minSA = 1000000,
		maxSA = 150000000;

	const bands: any[] = [];
	let isCalculating: boolean = false;

	for (let i = 1; i <= bandSize; i++) {
		let min = minAge;
		if (i > 1) {
			min = bands[i - 2].maxAge + 1;
		}
		bands.push({
			minAge: min,
			maxAge: minAge + ((maxAge - minAge) / bandSize) * i,
			sa: minSA + ((maxSA - minSA) / bandSize) * i
		});
	}

	let calculatedValues = {
		payment_frequency: 'monthly',
		sum_assured: 0,
		basic_premium: 0,
		pcf: 0,
		policy_fee: 0,
		total_payable: 0
	};

	let payload = {
		age: 18,
		term: '',
		plan: '',
		name: '',
		phone: '',
		email: '',
		smoker: 'No',
		gender: ''
	};
	const today = new Date().toISOString(); //.split('T')[0];

	let selectedSumAssured = 0,
		selectedPremium = 0,
		mobile = '',
		date = '',
		usePremium = false;

	const { form, errors, handleChange, handleSubmit } = createForm({
		initialValues: payload,
		validationSchema: yup.object().shape({
			age: yup.number().required(),
			gender: yup.string().required(),
			term: yup.string().required(),
			plan: yup.string().required(),
			name: yup.string().required(),
			phone: yup.string(),
			email: yup.string().email().required(),
			smoker: yup.string().required()
		}),
		onSubmit: async (values) => {
			if (
				$errors.age ||
				$errors.gender ||
				$errors.term ||
				$errors.plan ||
				$errors.name ||
				$errors.email ||
				$errors.smoker
			) {
				console.log($errors);

				alert(JSON.stringify($errors));
				return;
			}

			payload = values;
			selectedSumAssured = 0;
			selectedPremium = 0;
			usePremium = false; // only use SA on the main form

			getQuote(false);

			// console.log(data);
		}
	});

	async function getQuote(emailQuote: boolean) {
		isCalculating = true;
		let plan_type = 'plan-a';
		if (payload.plan.toLocaleLowerCase().includes('plan b')) {
			plan_type = 'plan-b';
		}

		const dob = dayjs()
			.subtract(Number(payload.age), 'years')
			.subtract(1, 'months')
			.format('YYYY-MM-DD');

		const sumAssured =
			selectedSumAssured ||
			bands.find((dt) => payload.age >= dt.minAge && payload.age <= dt.maxAge).sa;

		const reqPayload = {
			request_type: emailQuote ? 'email-quote' : 'calculated-figures',
			plan_type,
			application_type: 'single',
			premium_term: payload.term.replaceAll('_', ' '),
			applicant: {
				dob,
				gender: payload.gender.toLocaleLowerCase(),
				status: payload.smoker == 'Yes' ? 'smoker' : 'non-smoker'
			},
			client_name: payload.name,
			client_email: payload.email,
			payment_frequency: 'monthly',
			amount_type: usePremium ? 'affordable-premium' : 'target-amount',
			amount_value: usePremium ? selectedPremium : sumAssured,
			client_quote: true
		};

		console.log(reqPayload);

		const url = 'https://api-calculator.prudentiallife.co.ke/api/v1/prulife';
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				email: 'info@prudentiallife.co.ke',
				'pass-Key': 'SKYY7-BEFK2-A4HBU-XDVYW-EJ4VF'
			},
			body: JSON.stringify(reqPayload)
		}).catch((err) => {
			console.log(err);
		});

		const data = await response?.json();
		isCalculating = false;
		console.log(data);

		if (data.status) {
			calculatedValues = data.calcutatedValues;
			selectedSumAssured = Math.floor(calculatedValues.sum_assured);
			selectedPremium = Math.floor(calculatedValues.total_payable);
			defaultModal = true;
		} else {
			showError = true;
			if (data.errors) {
				let errors = '';
				for (let i of data.errors) {
					errors += i.msg;
				}
				errorMsg = errors;
			} else {
				errorMsg = data.message || 'Request failed, please try again';
			}
		}
	}

	async function saveLeadToDb() {
		await getQuote(true);
		if (!mobile || !date) {
			return;
		}
		let fname = $form.name.split(' ')[0].trim();
		let lname = $form.name.split(' ')[1].trim();
		const leadPayload: LeadPayload = {
			fname,
			lname,
			email: $form.email,
			mnumber: mobile,
			campaign: 'PRULife Campaign 2023',
			isDigital: true,
			is_from_agent: false,
			source: 'Microsite',
			age: payload.age,
			gender: payload.gender,
			smoker: payload.smoker,
			product: `PRULife (${payload.plan})`,
			coverAmount: selectedSumAssured,
			premium: selectedPremium
		};

		

		const res = await saveLead(leadPayload);
		console.log(res);

		if (res.success) {
			//close modal
		} else {
			// allow re-submission
		}
	}

	function classNames(...classes: any) {
		return classes.filter(Boolean).join(' ');
	}
	//const width = screen.width;
	//console.log(width);
</script>

<!-- Error modal -->
<Modal bind:open={showError} size="xs" autoclose>
	<div class="text-center">
		<svg
			aria-hidden="true"
			class="mx-auto mb-4 w-14 h-14 text-gray-400 dark:text-gray-200"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			><path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/></svg
		>
		<h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">{errorMsg}</h3>
		<!-- <Button color="red" class="mr-2">Close</Button> -->
		<button
			on:click={() => (showError = false)}
			class="  text-gray-50 bg-primary hover:bg-red-400 font-medium rounded-md text-sm px-5 py-2.5 text-center mr-2 mb-2"
		>
			Close
		</button>
	</div>
</Modal>

<!-- Pop over -->
<Popover class="w-64 text-sm font-light " title="Critical illnes cover" triggeredBy="#p1">
	A lump sum payment that is made to a customer to relieve them of financial strain caused by a
	first time diagnosis of a critical or terminal illness as defined in a policy
</Popover>

<!-- Modal - calculator response -->
<Modal title="Cover amounts and benefits" bind:open={defaultModal} autoclose>
	<p class="text-sm font-normal text-gray-500 dark:text-gray-400">
		Once you accept this quotation, we will reach out to you to walk you through the cover details
		and additional options.
	</p>
	<ul class="my-0 space-y-3 ">
		<li>
			<div
				class="flex items-center p-5 text-base font-bold text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
			>
				<Indicator color="teal" />
				<span class="flex-1 ml-3 whitespace-nowrap">Cover amount</span>
				<div class="flex-2">
					<span class=" ml-3 whitespace-nowrap">KES</span>
					<!-- {Number(calculatedValues.sum_assured).toLocaleString()} -->
					<input
						class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200"
						id="sa"
						bind:value={selectedSumAssured}
						on:blur={() => (usePremium = false)}
						type="number"
					/>
				</div>
			</div>
		</li>
		<li>
			<div
				class="flex items-center p-5 text-base font-bold text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
			>
				<Indicator color="teal" />
				<span class="flex-1 ml-3 whitespace-nowrap">Monthly premium</span>
				<div class="flex-2">
					<span class=" ml-3 whitespace-nowrap">KES</span>
					<!-- {Number(calculatedValues.sum_assured).toLocaleString()} -->
					<input
						class=" rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200"
						id="premium"
						bind:value={selectedPremium}
						on:blur={() => (usePremium = true)}
						type="number"
					/>
				</div>
			</div>
		</li>
	</ul>

	{#if isCalculating}
		<button
			class="flex-1 mb-5  hover:text-gray-50 hover:bg-primary border border-gray-200 bg-red-100 text-primary  font-medium rounded-md text-sm px-5 py-2.5 text-center"
		>
			<Spinner class="mr-3" size="4" />
			Re-calculating ...
		</button>
	{:else}
		<button
			type="button"
			on:click={() => getQuote(false)}
			class="flex-1 mb-5 hover:text-gray-50 hover:bg-primary border border-gray-200 bg-red-100 text-primary  font-medium rounded-md text-sm px-5 py-2.5 text-center "
			>Re-calculate</button
		>
	{/if}

	<!-- contact info -->
	<p class="font-normal text-gray-500 dark:text-gray-400">
		{guide}
	</p>
	<div class=" bg-gray-100 p-5 rounded-xl ">
		<div class="flex gap-5">
			<div class="flex flex-col flex-1">
				<label for="mobile" class=" mb-2 text-base font-bold text-gray-900 dark:text-white"
					>Phone number
				</label>
				<input
					class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200"
					id="mobile"
					bind:value={mobile}
					type="text"
				/>
			</div>
			<div class="flex flex-col flex-1">
				<label for="date" class=" mb-2 text-base font-bold text-gray-900 dark:text-white"
					>Date and Time
				</label>
				<input
					class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200"
					id="date"
					bind:value={date}
					min={today}
					type="datetime-local"
				/>
			</div>
		</div>
	</div>

	<svelte:fragment slot="footer">
		<button
			on:click={saveLeadToDb}
			class="  text-gray-50 bg-primary hover:bg-red-400 font-medium rounded-md text-sm px-8 py-2.5 text-center mr-2 mb-2"
		>
			Proceed
		</button>
		<!-- <button
			class=" text-gray-800 bg-transparent border border-gray-200 hover:bg-red-100 hover:text-primary  font-medium rounded-md text-sm px-5 py-2.5 text-center mr-2 mb-2"
		>
			Close
		</button> -->
	</svelte:fragment>
</Modal>

<!-- body -->
<div class="bg-background">
	<!-- Banner Section -->
	<section id="banner">
		<!-- Flex Container -->
		<div class="relative container flex items-center px-6 mx-auto mt-0 w-full rounded-xl">
			<img src={bannerImg1} alt="Banner" class="object-cover rounded-xl" />
			<div
				class="absolute text-2xl w-full md:max-w-xs top-5/12 ml-3 md:ml-0 md:left-24 text-primary font-extrabold md:text-3xl lg:text-5xl"
			>
				<h3>Life insured is</h3>
				<h3>love assured.</h3>
			</div>
		</div>
	</section>

	<section id="banner-divider">
		<div class="container flex px-6 mx-auto my-10 md:my-16 justify-center items-center">
			<div class="flex flex-col text-2xl font-bold text-center md:text-3xl lg:text-5xl">
				<h1>Get the only life insurance cover that</h1>
				<h1>you don't have to pay for, for life.</h1>
			</div>
		</div>
	</section>

	<!-- Calculator Section -->
	<section id="calculator">
		<!-- Flex Container -->
		<div class={classNames('container flex w-full mx-auto px-6 mt-10')}>
			<div
				class={classNames(
					'flex flex-col md:flex-row w-full md:max-w-6xl items-center space-x-0',
					'md:space-x-5 bg-secondary rounded-lg ml-0 md:ml-32'
				)}
			>
				<!-- left image on web, hide on mobile -->
				<div class="hidden relative md:flex md:w-1/3 md:-ml-20 mt-auto">
					<div class="absolute bottom-0 w-full">
						<img src={family} alt="family" class="object-cover object-bottom" />
					</div>
				</div>
				<!-- calculator -->
				<div class="flex flex-col mb-0 w-full space-y-3 md:w-2/3 py-3">
					<h1
						class="flex w-full text-xl font-bold items-center justify-center px-3 md:px-0 md:text-3xl lg:text-4xl text-primary mt-3"
					>
						Your life is worth something
					</h1>
					<h1 class={classNames("flex w-full items-center justify-center font-bold text-xl px-3 md:px-0 md:text-2xl")}>
						We can't really put a figure to it,
					</h1>
					<p
						class="flex w-full items-center justify-center font-bold text-xl px-3 md:px-0 md:text-2xl lg:text-3xl text-primary"
					>
						but we can't leave it at zero
					</p>
					<!-- Form -->
					<form
						on:submit={handleSubmit}
						class="flex flex-col w-full space-y-3 md:border p-6 rounded-lg"
					>
						<!-- Age -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="age"
								class="range block text-base font-bold text-gray-900 dark:text-white w-full md:w-1/4"
							>
								Your age</label
							>
							<div class="flex flex-row items-center w-full md:w-3/4">
								<input
									id="age"
									type="range"
									min="18"
									max="60"
									on:change={handleChange}
									bind:value={$form.age}
									class="w-2/3 md:w-1/2 h-2 bg-white text-primary rounded-lg appearance-none cursor-pointer accent-red-900"
								/>
								<input
									class="w-1/3 md:w-1/2 flex items-center ml-4 rounded-lg bg-gray-50 appearance-none border border-gray-200  py-2 px-2 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 "
									id="age"
									type="number"
									on:change={handleChange}
									bind:value={$form.age}
								/>
							</div>
						</div>
						<!-- Smoker -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="smoker"
								class="block text-base font-bold text-gray-900 dark:text-white w-full md:w-1/4"
								>Are you a smoker?</label
							>
							<div class="flex items-center w-full md:w-3/4">
								<div class="flex items-center mr-4">
									{#each options as p}
										<input
											type="radio"
											name="smoker"
											id={`smoker-${p}`}
											value={p}
											on:change={handleChange}
											checked={$form.smoker == p}
											class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 "
										/>
										<label
											for={`smoker-${p}`}
											class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300"
											>{p}</label
										>
									{/each}
								</div>
							</div>
						</div>
						<!-- gender -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="gender"
								class="block text-base font-bold text-gray-900 dark:text-white w-full md:w-1/4"
								>Your gender</label
							>
							<div class="flex items-center w-full md:w-3/4">
								<div class="flex items-center mr-4">
									{#each genderOptions as p}
										<input
											type="radio"
											name="gender"
											id={`gender-${p}`}
											value={p}
											on:change={handleChange}
											checked={$form.gender == p}
											class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 "
										/>
										<label
											for={`gender-${p}`}
											class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300"
											>{p}</label
										>
									{/each}
								</div>
							</div>
						</div>
						<!-- Plan -->
						<label for="plan" class="block text-base font-bold text-gray-900 dark:text-white"
							>Choose your plan</label
						>
						<div class="flex">
							<div class="flex items-center mr-4">
								{#each plans as p}
									<input
										type="radio"
										name="plan"
										id={`plan-${p}`}
										value={p}
										on:change={handleChange}
										checked={$form.plan == p}
										class="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 focus:ring-red-500 "
									/>
									<label
										for={`plan-${p}`}
										class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300"
										>{p}</label
									>
								{/each}
								<svg
									aria-hidden="true"
									class="w-5 h-5 fill-gray-500"
									id="p1"
									fill="gray"
									viewBox="0 0 20 20"
									xmlns="http://www.w3.org/2000/svg"
									><path
										fill-rule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
										clip-rule="evenodd"
									/></svg
								>
							</div>
						</div>
						<!-- Term -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="term"
								class="block text-base font-bold text-gray-900 dark:text-white w-full md:w-1/2"
								>How long do you want to pay for your policy?</label
							>
							<select
								id="term"
								bind:value={$form.term}
								class="bg-gray-50 border flex-grow border-gray-300 text-sm rounded-lg focus:ring-red-200 focus:border-red-200 block w-full p-2.5 md:w-1/4"
							>
								<!-- <option selected class="text-gray-400" value="" disabled
									>How long do you want to save?</option
								> -->
								<option value="10_years">For 10 Years</option>
								<option value="15_years">For 15 Years</option>
								<option value="20_years">For 20 Years</option>
								<option value="to_age_60">Up to age 60</option>
								<option value="to_age_65">Up to age 65</option>
								<option value="whole_life">My whole life</option>
							</select>
						</div>
						<!-- Name -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="name"
								class="block text-base justify-center font-bold text-gray-900 dark:text-white w-full md:w-1/2"
								>Your name</label
							>
							<input
								class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 w-full md:w-1/2"
								id="name"
								type="text"
								on:change={handleChange}
								bind:value={$form.name}
							/>
						</div>
						<!-- Email -->
						<div class="flex flex-col md:flex-row w-full items-center">
							<label
								for="email"
								class="block text-base justify-center font-bold text-gray-900 dark:text-white w-full md:w-1/2"
								>Your email address</label
							>
							<input
								class="rounded-lg bg-gray-50 appearance-none border border-gray-200 p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 w-full md:w-1/2"
								id="email"
								type="text"
								on:change={handleChange}
								bind:value={$form.email}
							/>
						</div>

						{#if $errors.smoker}
							<div class="flex items-center space-x-3">
								<Indicator size={'xs'} color="red" />
								<small class="text-primary">{$errors.smoker}</small>
							</div>
						{/if}
						{#if $errors.gender}
							<div class="flex items-center space-x-3">
								<Indicator size={'xs'} color="red" />
								<small class="text-primary">{$errors.gender}</small>
							</div>
						{/if}
						{#if $errors.plan}
							<div class="flex items-center space-x-3">
								<Indicator size={'xs'} color="red" />
								<small class="text-primary">{$errors.plan}</small>
							</div>
						{/if}
						{#if $errors.name}
							<div class="flex items-center space-x-3">
								<Indicator size={'xs'} color="red" />
								<small class="text-primary">{$errors.name}</small>
							</div>
						{/if}
						{#if $errors.email}
							<div class="flex items-center space-x-3">
								<Indicator size={'xs'} color="red" />
								<small class="text-primary">{$errors.email}</small>
							</div>
						{/if}

						<!-- Submit -->
						<div>
							{#if isCalculating}
								<button
									class=" text-white bg-primary hover:bg-red-400 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2"
								>
									<Spinner class="mr-3" size="4" />
									Calculating ...
								</button>
							{:else}
								<button
									type="submit"
									class=" text-white bg-primary hover:bg-red-400 font-medium rounded-full text-sm px-10 py-2.5 text-center"
									>Calculate</button
								>
							{/if}
						</div>
					</form>
				</div>
			</div>
		</div>
	</section>
</div>

<!-- Hero Section -->
<section id="hero">
	<!-- Flex Container -->
	<div
		class={classNames(
			'container flex flex-col-reverse items-center px-6 mx-auto mt-14 space-y-0',
			'md:space-y-0 md:flex-row '
		)}
	>
		<!-- Left item -->
		<div class="flex flex-col space-y-4 w-full md:w-1/2 md:mr-16">
			<div
				class="flex flex-col mt-6 md:mt-0 max-w-prose text-2xl font-bold text-center md:text-3xl md:text-left md:tracking-wide"
			>
				<h3 class="md:text-3xl lg:text-4xl leading-loose">We have a simple belief -</h3>
				<h3 class=" md:text-3xl lg:text-4xl leading-loose">that life and love go hand in hand.</h3>
			</div>
			<p
				class="flex max-w-prose text-center text-xl md:text-3xl md:text-left font-medium md:mt-2 leading-loose"
			>
				Here's life insurance that's more than just a policy. We've made sure that the products we
				design help you live life well. PRULife is life insurance for what truly matters most to you
				- your loved ones.
			</p>
			<p
				class="flex max-w-prose text-center text-primary text-xl md:text-3xl md:text-left md:mt-2 leading-loose"
			>
				Because when it comes to life, don't leave it to chance. Leave it to us.
			</p>
		</div>
		<!-- Image -->
		<div class="flex w-full md:w-1/2">
			<img src={grandfather} alt="grandfather" class="object-cover" />
		</div>
	</div>
</section>
