const config = {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],

	theme: {
		colors: {
			primary: '#DA291C',
			secondary: '#BFBFBE',
			background: '#F7F7F7'
		},
		fontFamily: {
			FSAlbertProRegular: ["FSAlbertProRegular", "verdana"],
			FSAlbertProBold: ["FSAlbertProBold", "verdana"],
		  },
	  
		extend: {}
	},

	plugins: [require('flowbite/plugin')],
	darkMode: 'class'
};

module.exports = config;
