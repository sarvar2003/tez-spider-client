import axios from "axios";


// const baseURL = 'http://localhost:4000/'
const baseURL = 'https://tezspider-server.herokuapp.com/'

// const token = localStorage.getItem('token')

const axiosInstance = axios.create({
    baseURL: baseURL,
    timeout: 5000,
    headers: { 
        // Authorization: token !== null ? `Token ${token}`:null,  // If no user is authenticated, leave it blank
        'Content-Type': 'application/json',
        accept: 'application/json',
    },
});

axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },

    async function (error) {
		const originalRequest = error.config;

		if (typeof error.response === 'undefined') {
			alert(
				'A server/network error occurred. ' +
					'Looks like CORS might be the problem. ' +
					'Sorry about this - it is on us, we will get it fixed shortly.'
			);
			return Promise.reject(error);
		}

		if (
			error.response.status === 401 &&
			originalRequest.url === baseURL + 'token/refresh/'
		) {
			window.location.href = '/login/';
			return Promise.reject(error);
		}

		if (
			error.response.data.code === 'token_not_valid' &&
			error.response.status === 401 &&
			error.response.statusText === 'Unauthorized'
		) {
			const refreshToken = localStorage.getItem('token');

			if (refreshToken) {
				const tokenParts = JSON.parse(atob(refreshToken.split('.')[1]));

				// exp date in token is expressed in seconds, while now() returns milliseconds:
				const now = Math.ceil(Date.now() / 1000);
				console.log(tokenParts.exp);

				if (tokenParts.exp > now) {
					return axiosInstance
						.post('/token/refresh/', {
							refresh: refreshToken,
						})
						.then((response) => {
							localStorage.setItem('token', response.data.access);

							axiosInstance.defaults.headers['Authorization'] =
								'Token ' + response.data.access;
							originalRequest.headers['Authorization'] =
								'Token ' + response.data.access;

							return axiosInstance(originalRequest);
						})
						.catch((err) => {
							console.log(err);
						});
				} else {
					console.log('Refresh token is expired', tokenParts.exp, now);
					window.location.href = '/login/';
				}
			} else {
				console.log('Refresh token not available.');
				window.location.href = '/login/';
			}
		}

		// specific error handling done elsewhere
		return Promise.reject(error);
	}
);

export default axiosInstance;