import '@babel/polyfill';
import { displayMap } from './mapbox';
import { login, logout } from './login';
import { signup } from './signup';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';
import{createReview} from './review'

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');
const signupForm = document.querySelector('.form--signup');

const reviewBtn = document.querySelector('.btn--review');
const reviewSave = document.querySelector('.review-save');
const closeReview = document.querySelector('.close');

console.log('Just Do It');

// DELEGATION
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}
  
if (loginForm){
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
} 

if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm) {
  userDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--green').textContent = 'Updating...'
    // guard clause
    /* if (!e.target.classList.contains('form-user-data')) {
        return;
      } */
    /* const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    updateSettings({ name, email }, 'data'); */
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    console.log(form);

    await updateSettings(form, 'data');
    
    document.querySelector('.btn--green').textContent = 'Save settings'
    location.reload();//to avoid manual reloading for new image to showup
  });
}

if (userPasswordForm){
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    //gaurd clause
    /* if (!e.target.classList.contains('form-user-password')) {
        return;
      } */
    document.querySelector('.btn--save-password').textContent = 'Updating...';
 
    const currentPassword = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings({ currentPassword, password, passwordConfirm },'password');

    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}  

if (signupForm) {
  signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      document.querySelector('.btn--signup').textContent = 'Sign Up...';
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const passwordConfirm = document.getElementById('passwordconfirm').value;
      await signup(name, email, password, passwordConfirm);
  });
};

if (bookBtn){
  bookBtn.addEventListener('click', e => {
    e.target.textContent = 'Processing...';
    const { tourId } = e.target.dataset;
    //const  tourId  = e.target.dataset.tourId
    bookTour(tourId);
  });
}  

if (reviewBtn) {
  reviewBtn.addEventListener('click', () => {
      document.querySelector('.bg-modal').style.display = "flex";
  });
}

if (closeReview) {
  closeReview.addEventListener("click", () => {
      document.querySelector('.bg-modal').style.display = "none";
  });
}

if (reviewSave) {
  reviewSave.addEventListener("click", async e => {
      const review = document.getElementById('review').value;
      const rating = document.getElementById('ratings').value;
      const { tourId } = e.target.dataset;
      await createReview(tourId, review, rating);
      document.querySelector('.bg-modal').style.display = "none";
  });
}