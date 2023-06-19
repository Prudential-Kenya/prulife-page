export async function saveLead(payload: LeadPayload) {

	const headersList = {
		"Accept": "*/*",
		"Content-Type": "application/json"
	   }
	const url = 'https://api-agency.prudentiallife.co.ke/leads-new/new-lead';
	// const url = 'http://localhost:1000/leads-new/new-lead';
	const response = await fetch(url, {
		method: 'POST',
		headers: headersList,
		body: JSON.stringify(payload)
	}).catch((err) => {
		console.log(err);
	});

	const data = await response?.json();
	console.log(data);
	return data;
}

export interface LeadPayload {
	fname: string;
	lname: string;
	email: string;
	mnumber: string;
	campaign: string;
	activation?: string;
	source: string;
	isDigital: boolean;
	is_from_agent: boolean;
	age: number;
	gender: string;
	smoker: boolean;
	product: string;
	term: string;
	dateToContact: string;
	coverAmount?: number;
	premium?: number;
}
