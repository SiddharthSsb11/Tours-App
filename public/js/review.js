import axios from 'axios';
import { showAlert } from './alerts';
 
export const createReview = async (tourId, review, rating) => {
    try {
        const tour = tourId
        const url =`http://localhost:3000/api/v1/reviews`;
        const res = await axios({
            method: 'POST',
            url,
            data: {
                tour,
                rating,
                review
            }
        });
 
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} review created Successfully`);
        }
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}