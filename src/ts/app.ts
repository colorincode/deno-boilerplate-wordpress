
//optional import tests only, these are not crucial to build steps

// import * as THREE from 'three';
import Splide from "@splidejs/splide";
import gsap, { SteppedEase} from 'gsap'
import Draggable from 'gsap/Draggable';
import EasePack from 'gsap/EasePack';
import { Power4 } from 'gsap/gsap-core';
import Observer from 'gsap/Observer';
import Timeline from 'gsap/all';
import  Tween  from 'gsap/src/all';
import './module.ts';
//gsap registration, global scope
gsap.registerPlugin(EasePack);
gsap.registerPlugin(Tween);
gsap.registerPlugin(SteppedEase);
gsap.registerPlugin(Timeline);
gsap.registerPlugin(Power4);
gsap.registerPlugin(Observer);

//__________________________________________________________________ burger menu
const hamburger = document.getElementById('hamburger');
const navList = document.querySelector('.global__nav--list');
let menuOpen = false;
const tl = gsap.timeline({ paused: true });
gsap.set(navList, { x: '100%', opacity: 0 });

tl.to(navList, {
  duration: 0.5,
  x: 0,
  opacity: 1,
  ease: "power3.out",
});

function toggleMenu() {
  if (window.innerWidth < 768) {
    menuOpen = !menuOpen;

    if (menuOpen) {
      navList.classList.add('active');
      tl.play();
    } else {
      tl.reverse();
      tl.eventCallback('onReverseComplete', () => {
        navList.classList.remove('active');
      });
    }
  }
}

hamburger.addEventListener('click', toggleMenu);

window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) {
    navList.classList.remove('active');
    gsap.set(navList, { clearProps: "all" });
    menuOpen = false;
  }
});

//__________________________________________________________________ caurosuel 
async function loadFeaturedCarousel() {
  const container = document.getElementById('featured-carousel');
  if (!container) return;

  try {
    const res = await fetch('http://localhost:8000/src/get-products.php?featured=true');
    const products = await res.json();

    container.innerHTML = `
      <ul class="splide__list">
        ${products.map((p: any) => `
          <li class="splide__slide">
            <a href="#" class="product-card">
              <img src="${p.image}" alt="${p.name}">
              <h3>${p.name}</h3>
              <p class="price">$${p.price.toFixed(2)}</p>
            </a>
          </li>
        `).join('')}
      </ul>
    `;

    // init
  new Splide('.splide', {
      type: 'loop',
      perPage: 3,
      gap: '1.5rem',
      autoplay: false,
      pauseOnHover: true,
      arrows: true,
      autoWidth: true,
      breakpoints: {
        1024: { perPage: 2 },
        768: { perPage: 1 },
      },
    }).mount();

    // const prevBtn = document.querySelector('.carousel__nav.prev') as HTMLElement;
    // const nextBtn = document.querySelector('.carousel__nav.next') as HTMLElement;

    // prevBtn.addEventListener('click', () => splide.go('<'));
    // nextBtn.addEventListener('click', () => splide.go('>'));

  } catch (err) {
    console.error('Error loading featured products:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadFeaturedCarousel);


// async function loadFeaturedCarousel() {
//   const container = document.getElementById('featured-carousel');
//   if (!container) return;

//   try {
//     const res = await fetch('http://localhost:8000/src/get-products.php?featured=true');
//     const products = await res.json();

//     container.innerHTML = products.map((p: any) => `
//       <a href="#" class="product-card">
//         <img src="${p.image}" alt="${p.name}">
//         <h3>${p.name}</h3>
//         <p class="price">$${p.price.toFixed(2)}</p>
//       </a>
//     `).join('');

//     const prevBtn = document.querySelector('.carousel__nav.prev') as HTMLElement;
//     const nextBtn = document.querySelector('.carousel__nav.next') as HTMLElement;

//     prevBtn.addEventListener('click', () => {
//       container.scrollBy({ left: -300, behavior: 'smooth' });
//     });
//     nextBtn.addEventListener('click', () => {
//       container.scrollBy({ left: 300, behavior: 'smooth' });
//     });
//   } catch (err) {
//     console.error('Error loading featured products:', err);
//   }
// }

// document.addEventListener('DOMContentLoaded', loadFeaturedCarousel);
