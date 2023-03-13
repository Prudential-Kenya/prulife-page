export async function saveLead(payload: LeadPayload) {
	const url = 'https://api-agency.prudentiallife.co.ke/leads-new/new-lead';
	const response = await fetch(url, {
		method: 'POST',
		// headers: {
		// 	'Content-Type': 'application/json',
        //     'Accept': '*/*'
		// },
        mode:'no-cors',
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
}
