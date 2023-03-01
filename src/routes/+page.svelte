<script lang="ts">
	import { createForm } from 'svelte-forms-lib';
	import family from '$lib/images/mother_childv2.png';
	import grandfather from '$lib/images/grandfather.png';
	import bannerImg from '$lib/images/banner.png';
	import * as yup from 'yup';
	import dayjs from 'dayjs';

	import { Button, Modal, Spinner, Toast } from 'flowbite-svelte';
	import { Indicator } from 'flowbite-svelte';
	import { slide } from 'svelte/transition';
	let defaultModal = false, showError = true, errorMsg='';

	const plans = [
		'Plan A (Life Protection only)',
		'Plan B (Life Protection with critical illness cover)'
	];
	const options = ['Yes', 'No'];
	const genderOptions = ['Male', 'Female'];
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

	const { form, errors, handleChange, handleSubmit } = createForm({
		initialValues: {
			age: '18',
			term: '',
			plan: '',
			name: '',
			phone: '',
			email: '',
			smoker: '',
			gender: ''
		},
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
			isCalculating = true;
			// alert(JSON.stringify(values, null, 2));
			let plan_type = 'plan-a';
			if (values.plan.toLocaleLowerCase().includes('plan b')) {
				plan_type = 'plan-b';
			}

			const dob = dayjs()
				.subtract(Number(values.age), 'years')
				.subtract(1, 'months')
				.format('YYYY-MM-DD');

			const sumAssured = bands.find((dt) => values.age >= dt.minAge && values.age <= dt.maxAge).sa;

			const payload = {
				request_type: 'calculated-figures',
				plan_type,
				application_type: 'single',
				premium_term: values.term.replaceAll('_', ' '),
				applicant: {
					dob,
					gender: values.gender.toLocaleLowerCase(),
					status: values.smoker == 'Yes' ? 'smoker' : 'non-smoker'
				},
				payment_frequency: 'monthly',
				amount_type: 'target-amount',
				amount_value: sumAssured
			};

			// const url = 'http://197.248.119.187:1000/api/v1/prulife';
			const url = 'https://api-calculator.prudentiallife.co.ke/api/v1/prulife'
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					email: 'info@prudentiallife.co.ke',
					'pass-Key': 'SKYY7-BEFK2-A4HBU-XDVYW-EJ4VF'
				},
				// mode:'no-cors',
				body: JSON.stringify(payload)
			}).catch((err) => {
				console.log(err);
			});
	
			const data = await response?.json();
			isCalculating = false;
			console.log(data);

			if (data.status) {
				calculatedValues = data.calcutatedValues;
				defaultModal = true;
			}else{
				
				showError = true;
				let errors = ''
				for(let i of data.errors) {
					errors += i.msg
				}
				errorMsg = errors
			}

			// console.log(data);
		}
	});
	
</script>

<div class="bg-gray-100 m-8 ">
	<!-- Banner Section -->
	<section id="banner">
		<!-- Flex Container -->
		<div class="relative container flex items-center px-6 mx-auto mt-10 w-full">
			<img src={bannerImg} alt="Banner" class="object-cover" />
			<h3
				class="absolute text-2xl max-w-xs top-5/12 left-24 text-primary font-bold md:max-w-md md:text-4xl lg:text-6xl"
			>
				Life insured is love assured
			</h3>
		</div>
	</section>

	<section id="banner-divider">
		<div class="container flex  px-6 mx-auto my-16 md:my-24 justify-end items-center">
			<h1
			class="  text-4xl font-bold text-center md:text-5xl"
		>
			Get the only life insurance cover that you don't have to pay for for life.
		</h1>
		</div>
	</section>

	<!-- Calculator Section -->
	<section id="calculator">
		<!-- Flex Container -->
		<div
			class="container flex max-w-7xl rounded-2xl justify-center px-6 mx-auto mt-10 space-y-0 md:space-y-0  bg-gray-300  hover:shadow-md  md:flex-row items-stretch"
		>
			<!-- Left item -->
			<div
				class=" hidden  justify-items-stretch  align-bottom  lg:items-end  lg:-ml-32 lg:flex lg:w-1/2"
			>
				<img src={family} alt="family" class="object-cover object-bottom" />
			</div>
			<!-- Calculator -->
			<div class="flex flex-col mb-32 space-y-4 md:w-auto py-6 md:ml-10">
				<h1
					class="max-w-prose text-3xl font-bold text-center md:text-4xl text-primary md:text-left"
				>
					Your life isn't worth nothing
				</h1>
				<p class="max-w-prose text-center text-2xl md:text-3xl text-primary mb-20 md:text-left">
					Your legacy is worth everything
				</p>
				<!-- Form -->
				<form
					on:submit={handleSubmit}
					class="flex flex-col  w-full min-w-full border p-6 rounded-lg "
				>
					<!-- Age -->
					<label
						for="age"
						class="range block mb-2 text-base  font-bold text-gray-900 dark:text-white"
						>Your age</label
					>
					<div class="flex flex-row items-center mb-5">
						<input
							id="age"
							type="range"
							min="18"
							max="60"
							on:change={handleChange}
							bind:value={$form.age}
							class="basis-11/12 h-2 bg-white rounded-lg appearance-none cursor-pointer accent-green-500"
						/>

						<input
							class=" flex items-center basis-1/12 ml-4 rounded-lg bg-gray-50 appearance-none border border-gray-200  py-2 px-2 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 "
							id="age"
							type="number"
							on:change={handleChange}
							bind:value={$form.age}
						/>
					</div>

					<!-- Smoker -->
					<label for="smoker" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>Are you a smoker?</label
					>
					<div class="flex mb-5">
						<div class="flex items-center mr-4">
							{#each options as p}
								<input
									type="radio"
									name="smoker"
									id={`smoker-${p}`}
									value={p}
									on:change={handleChange}
									checked={$form.smoker == p}
									class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 "
								/>
								<label
									for={`smoker-${p}`}
									class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">{p}</label
								>
							{/each}
						</div>
					</div>

					<!-- gender -->
					<label for="gender" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>Your gender</label
					>
					<div class="flex mb-5">
						<div class="flex items-center mr-4">
							{#each genderOptions as p}
								<input
									type="radio"
									name="gender"
									id={`gender-${p}`}
									value={p}
									on:change={handleChange}
									checked={$form.gender == p}
									class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 "
								/>
								<label
									for={`gender-${p}`}
									class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">{p}</label
								>
							{/each}
						</div>
					</div>

					<!-- Plan -->
					<label for="plan" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>Choose your plan</label
					>
					<div class="flex mb-5">
						<div class="flex items-center mr-4">
							{#each plans as p}
								<input
									type="radio"
									name="plan"
									id={`plan-${p}`}
									value={p}
									on:change={handleChange}
									checked={$form.plan == p}
									class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 "
								/>
								<label
									for={`plan-${p}`}
									class="ml-2 mr-2 text-sm font-medium text-gray-900 dark:text-gray-300">{p}</label
								>
							{/each}
						</div>
					</div>

					<!-- Term -->
					<label for="term" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>How long do you want to pay for your policy?</label
					>
					<select
						id="term"
						bind:value={$form.term}
						class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-red-200 focus:border-red-200 block w-full p-2.5 mb-5"
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

					<!-- Name -->
					<label for="name" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>Your name</label
					>
					<input
						class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 "
						id="name"
						type="text"
						on:change={handleChange}
						bind:value={$form.name}
					/>

					<!-- Email -->
					<label
						for="email"
						class="block mb-2 text-base font-bold text-gray-900 dark:text-white mt-5"
						>Your email address</label
					>
					<input
						class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 mb-5"
						id="email"
						type="text"
						on:change={handleChange}
						bind:value={$form.email}
					/>

					<!-- Phone -->
					<label for="phone" class="block mb-2 text-base font-bold text-gray-900 dark:text-white"
						>Your phone number (Optional)</label
					>
					<input
						class="rounded-lg bg-gray-50 appearance-none border border-gray-200  p-2.5 text-gray-900 leading-tight focus:outline-none focus:bg-white  focus:ring-red-200 focus:border-red-200 mb-5"
						id="phone"
						type="text"
						on:change={handleChange}
						bind:value={$form.phone}
					/>
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
								class=" mt-7 text-white bg-primary hover:bg-red-400 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2"
								>
								<Spinner class="mr-3" size="4" />
								Calculating ...
					</button>
						{:else}
							<button
								type="submit"
								class=" mt-7 text-white bg-primary hover:bg-red-400 font-medium rounded-full text-sm px-5 py-2.5 text-center mr-2 mb-2"
								>Calculate</button
							>
						{/if}
					</div>
				</form>
			</div>
		</div>
	</section>
</div>


<!-- Modal - calculator response -->
<Modal title="Cover amounts and benefits" bind:open={defaultModal} autoclose>
	<ul class="my-4 space-y-3">
		<li>
			<div
				class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
			>
				<Indicator color="teal" />
				<span class="flex-1 ml-3 whitespace-nowrap">Monthly premium</span>
				<span class="inline-flex ml-3 whitespace-nowrap"
					>KES {Number(calculatedValues.total_payable).toLocaleString()}</span
				>
			</div>
		</li>
		<li>
			<div
				class="flex items-center p-3 text-base font-bold text-gray-900 bg-gray-100 rounded-lg hover:bg-gray-200 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white"
			>
				<Indicator color="teal" />
				<span class="flex-1 ml-3 whitespace-nowrap">Sum assured</span>
				<span class="inline-flex ml-3 whitespace-nowrap"
					>KES {Number(calculatedValues.sum_assured).toLocaleString()}</span
				>
			</div>
		</li>
	</ul>
	<p class="text-sm font-normal text-gray-500 dark:text-gray-400">
		If you accept this quotation, one of our customer service representatives will contact you to
		walk you through the coverage process.
	</p>

	<svelte:fragment slot="footer">
		<button
			on:click={() => (defaultModal = false)}
			class="  text-white bg-primary hover:bg-red-400 font-medium rounded-md text-sm px-5 py-2.5 text-center mr-2 mb-2"
		>
			I accept
		</button>
		<button
			class=" text-gray-800 bg-transparent border border-gray-200 hover:bg-red-100 hover:text-primary  font-medium rounded-md text-sm px-5 py-2.5 text-center mr-2 mb-2"
		>
			Decline
		</button>
	</svelte:fragment>
</Modal>

<!-- Hero Section -->
<section id="hero">
	<!-- Flex Container -->
	<div
		class="container flex flex-col-reverse items-center px-6 mx-auto mt-14 space-y-0 md:space-y-0 md:flex-row "
	>
		<!-- Left item -->
		<div class="flex flex-col mb-32 space-y-4 md:w-1/2 md:mr-16">
			<h1 class="max-w-prose text-3xl font-bold text-center md:text-5xl md:text-left">
				We have a simple belief - that life and love go hand in hand.
			</h1>
			<p class="max-w-prose text-center text-xl md:text-2xl md:text-left">
				Here's life insurance that's more than just a policy. We've made sure that the products we
				design help you live life well. PRULife is life insurance for what truly matters most to you
				- your loved ones.
			</p>
			<p class="max-w-prose text-center text-primary text-xl md:text-left">
				Because when it comes to life, don't leave it to chance. Leave it to us.
			</p>
			<div class="flex justify-center md:justify-start">
				<a
					href="#top"
					class="p-3 px-6 pt-2 text-white bg-primary rounded-full baseline hover:bg-brightRedLight"
					>Get Started</a
				>
			</div>
		</div>
		<!-- Image -->
		<div class="md:w-1/2">
			<img src={grandfather} alt="grandfather" class="object-cover" />
		</div>
	</div>
</section>
