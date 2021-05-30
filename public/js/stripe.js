import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe('pk_test_51IteTDSJbdGvqUEHGPUcBiqDhmAf9zXodmwhPWfhtpCPqwAtJtl0WoTG4AKfZ5Ft3nFbAPnxmCx102HxuCFijV0P00vtoIQ3aa');

export const bookTour = async (tourId) => {
  try {
    //Get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
    );
    // console.log(session);

    //Create checkout form + charge payment card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,//axios obj session -- data.session.id
    });

  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
