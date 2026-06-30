/* ==========================================================================
   Srii Angalamman Travels - JavaScript Code
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. Navigation Header Scroll Effect
    // ==========================================
    const header = document.querySelector('.main-header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check on load

    // ==========================================
    // 2. Active Link Highlighting on Scroll
    // ==========================================
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-link');

    const updateActiveLink = () => {
        let currentSectionId = 'home';
        const scrollPosition = window.scrollY + 200; // Offset for header height

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                if (section.id) {
                    currentSectionId = section.id;
                }
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink);

    // ==========================================
    // 3. Mobile Navigation Menu Toggle
    // ==========================================
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    const body = document.body;

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', () => {
            mobileNavToggle.classList.toggle('open');
            navMenu.classList.toggle('open');
            // Prevent scrolling when mobile nav is open
            body.classList.toggle('no-scroll', navMenu.classList.contains('open'));
        });

        // Close mobile nav when clicking a link
        const menuLinks = navMenu.querySelectorAll('a, button');
        menuLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileNavToggle.classList.remove('open');
                navMenu.classList.remove('open');
                body.classList.remove('no-scroll');
            });
        });
    }

    // ==========================================
    // 4. Scroll triggered animations (Intersection Observer)
    // ==========================================
    const animateElements = document.querySelectorAll('.animate-up, .animate-scroll');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target); // Animates once
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px' // Trigger slightly before entry
        });

        animateElements.forEach(el => animationObserver.observe(el));
    } else {
        // Fallback for older browsers
        animateElements.forEach(el => el.classList.add('visible'));
    }

    // ==========================================
    // 5. Testimonial Slider Implementation (PostgreSQL Dynamic)
    // ==========================================
    const slider = document.getElementById('testimonialSlider');
    const prevBtn = document.getElementById('sliderPrev');
    const nextBtn = document.getElementById('sliderNext');
    const dotsContainer = document.getElementById('sliderDots');
    let slideInterval;

    function initTestimonialSlider() {
        if (!slider) return;
        const slides = slider.querySelectorAll('.testimonial-slide');
        const slideCount = slides.length;
        if (slideCount === 0) return;

        let currentIndex = 0;
        dotsContainer.innerHTML = ""; // Clear existing dots

        // Generate dot indicators dynamically
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }

        const dots = dotsContainer.querySelectorAll('.dot');

        const updateSlider = () => {
            slider.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentIndex);
            });
        };

        const nextSlide = () => {
            currentIndex = (currentIndex + 1) % slideCount;
            updateSlider();
        };

        const prevSlide = () => {
            currentIndex = (currentIndex - 1 + slideCount) % slideCount;
            updateSlider();
        };

        const goToSlide = (index) => {
            currentIndex = index;
            updateSlider();
            resetInterval();
        };

        const startInterval = () => {
            clearInterval(slideInterval);
            slideInterval = setInterval(nextSlide, 5000); // Auto slide every 5s
        };

        const resetInterval = () => {
            clearInterval(slideInterval);
            startInterval();
        };

        // Rebind arrows (cloning to remove old listeners)
        const newNextBtn = nextBtn.cloneNode(true);
        const newPrevBtn = prevBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

        newNextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
        newPrevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });

        slider.addEventListener('mouseenter', () => clearInterval(slideInterval));
        slider.addEventListener('mouseleave', startInterval);

        // Touch support for mobile swipe
        let startX = 0;
        let endX = 0;
        slider.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            clearInterval(slideInterval);
        });
        slider.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            const diffX = startX - endX;
            if (Math.abs(diffX) > 50) {
                if (diffX > 0) nextSlide(); // Swipe left -> next
                else prevSlide(); // Swipe right -> prev
            }
            startInterval();
        });

        startInterval();
    }

    // Function to load reviews from PostgreSQL and rebuild slider
    function loadPublicReviews() {
        fetch((window.API_BASE||'') + '/api/reviews')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    slider.innerHTML = "";
                    data.forEach(item => {
                        const slide = document.createElement('div');
                        slide.className = 'testimonial-slide';

                        let starsMarkup = "";
                        for (let i = 1; i <= 5; i++) {
                            if (i <= item.rating) starsMarkup += `<i class="fa-solid fa-star"></i>`;
                            else starsMarkup += `<i class="fa-regular fa-star"></i>`;
                        }

                        slide.innerHTML = `
                            <div class="testimonial-card">
                                <div class="quote-icon"><i class="fa-solid fa-quote-left"></i></div>
                                <div class="stars">${starsMarkup}</div>
                                <p class="testimonial-text">"${item.review}"</p>
                                <div class="client-info">
                                    <div class="client-avatar"><i class="fa-solid fa-user"></i></div>
                                    <div>
                                        <h4 class="client-name">${item.name}</h4>
                                        <span class="client-role">${item.role}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                        slider.appendChild(slide);
                    });
                }
                initTestimonialSlider();
            })
            .catch(err => {
                console.error('Error loading public reviews:', err);
                initTestimonialSlider(); // Fallback to existing HTML
            });
    }

    loadPublicReviews();

    // ==========================================
    // 6. Multi-step Booking Form Logic
    // ==========================================
    const multiStepForm = document.getElementById('multistepBookingForm');
    const stepPanels = document.querySelectorAll('.form-step-panel');
    const stepItems = document.querySelectorAll('.step-item');
    const stepLines = document.querySelectorAll('.step-line');
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    const successPopup = document.getElementById('bookingSuccessPopup');
    const closePopupBtn = document.getElementById('closeSuccessPopupBtn');
    const vehicleSelectField = document.getElementById('vehicleSelectField');
    
    let currentStep = 1;

    // Set travel date minimum to today
    const travelDateInput = document.getElementById('travelDateSelect');
    if (travelDateInput) {
        const today = new Date().toISOString().split('T')[0];
        travelDateInput.min = today;
    }

    const showStep = (step) => {
        stepPanels.forEach(panel => {
            panel.classList.toggle('active', parseInt(panel.dataset.step) === step);
        });

        stepItems.forEach(item => {
            const itemStep = parseInt(item.dataset.step);
            item.classList.toggle('active', itemStep === step);
            item.classList.toggle('completed', itemStep < step);
        });

        stepLines.forEach((line, index) => {
            line.classList.toggle('completed', index < step - 1);
        });
    };

    const validateStep = (step) => {
        const activePanel = document.querySelector(`.form-step-panel[data-step="${step}"]`);
        if (!activePanel) return true;
        
        const inputs = activePanel.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.reportValidity();
                isValid = false;
            }
        });
        
        return isValid;
    };

    // Next step navigation
    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (validateStep(currentStep)) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Back step navigation
    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Redirect all "Book Now" click events to booking section
    const bookNowBtns = document.querySelectorAll('.btn-book-now');
    bookNowBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const vehicle = e.currentTarget.getAttribute('data-vehicle') || "";
            
            const bookingSection = document.getElementById('booking');
            if (bookingSection) {
                bookingSection.scrollIntoView({ behavior: 'smooth' });
                
                if (vehicleSelectField && vehicle) {
                    // Normalize standard selector names to select box values
                    let val = "";
                    if (vehicle.includes("Innova")) val = "Innova";
                    else if (vehicle.includes("Van")) val = "Family Van";
                    else if (vehicle.includes("Tempo")) val = "Tempo Traveller";
                    else if (vehicle.includes("Sourcing")) val = "Extra Fleet Sourcing";
                    else if (vehicle.includes("Driver")) val = "Professional Driver Service";
                    
                    if (val) {
                        vehicleSelectField.value = val;
                    }
                }
            }
        });
    });

    // Multi-step form submission
    if (multiStepForm) {
        multiStepForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (!validateStep(currentStep)) return;

            // Collect form data
            const name = document.getElementById('contactName').value;
            const phone = document.getElementById('contactPhone').value;
            const email = document.getElementById('contactEmail').value;
            const date = document.getElementById('travelDateSelect').value;
            const members = document.getElementById('memberCount').value;
            const pickup = document.getElementById('pickupLocation').value;
            const drop = document.getElementById('dropoffLocation').value;
            const tripType = document.querySelector('input[name="tripTypeSelect"]:checked').value;
            const vehicle = vehicleSelectField.value;
            const specialInstructions = document.getElementById('specialInstructions').value;

            // Populate summary popup box
            document.getElementById('summaryName').textContent = name;
            document.getElementById('summaryVehicle').textContent = vehicle;
            document.getElementById('summaryRoute').textContent = `${pickup} ➔ ${drop} (${tripType})`;
            document.getElementById('summaryDate').textContent = date;

            // Submit button loading animation
            const submitBtn = multiStepForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

            // POST to database
            fetch((window.API_BASE||'') + '/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    booking_date: date,
                    name: name,
                    phone: phone,
                    email: email,
                    pickup: pickup,
                    dropoff: drop,
                    trip_type: tripType,
                    vehicle: vehicle,
                    passengers: parseInt(members),
                    special_instructions: specialInstructions
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('Network response was not ok');
                return res.json();
            })
            .then(data => {
                console.log('Booking persisted in PostgreSQL:', data);
                // Restore button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;

                // Show Success Popup
                if (successPopup) {
                    successPopup.classList.add('active');
                }

                // Clear the fields
                multiStepForm.reset();
            })
            .catch(err => {
                console.error('Failed to submit booking:', err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                alert('Database submission failed. Please try again.');
            });
        });
    }

    // Done / Close Success Popup button click
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', () => {
            if (successPopup) {
                successPopup.classList.remove('active');
            }
            
            // Reset to step 1
            currentStep = 1;
            showStep(currentStep);
        });
    }

    // ==========================================
    // 7. Public Feedback Critique Submission Logic
    // ==========================================
    const publicFeedbackForm = document.getElementById('publicFeedbackForm');
    const feedbackSuccess = document.getElementById('feedbackSubmitSuccess');
    const closeFeedbackSuccessBtn = document.getElementById('closeFeedbackSuccessBtn');

    if (publicFeedbackForm) {
        publicFeedbackForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = document.getElementById('feedbackName').value;
            const ratingInput = document.querySelector('input[name="feedbackRating"]:checked');
            const critique = document.getElementById('feedbackCritique').value;

            if (!ratingInput) {
                alert('Please select an experience rating.');
                return;
            }

            const rating = ratingInput.value;
            
            const submitBtn = publicFeedbackForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

            fetch((window.API_BASE||'') + '/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    rating: parseInt(rating),
                    critique: critique
                })
            })
            .then(res => {
                if (!res.ok) throw new Error('Network response not ok');
                return res.json();
            })
            .then(data => {
                console.log('Feedback critique logged in PostgreSQL:', data);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;

                // Toggle visibility
                publicFeedbackForm.style.display = 'none';
                if (feedbackSuccess) {
                    feedbackSuccess.style.display = 'block';
                }
            })
            .catch(err => {
                console.error('Failed to submit feedback critique:', err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                alert('Failed to submit critique. Please try again.');
            });
        });
    }

    if (closeFeedbackSuccessBtn) {
        closeFeedbackSuccessBtn.addEventListener('click', () => {
            if (feedbackSuccess) {
                feedbackSuccess.style.display = 'none';
            }
            if (publicFeedbackForm) {
                publicFeedbackForm.style.display = 'block';
                publicFeedbackForm.reset();
            }
        });
    }

    // Public Review Modal handlers
    const openReviewModalBtn = document.getElementById('openReviewModalBtn');
    const reviewModalOverlay = document.getElementById('reviewModalOverlay');
    const closeReviewModal = document.getElementById('closeReviewModal');
    const publicReviewForm = document.getElementById('publicReviewForm');
    const reviewSuccessMessage = document.getElementById('reviewSuccessMessage');
    const closeReviewSuccessBtn = document.getElementById('closeReviewSuccessBtn');

    if (openReviewModalBtn && reviewModalOverlay) {
        openReviewModalBtn.addEventListener('click', () => {
            reviewModalOverlay.classList.add('open');
            if (publicReviewForm) publicReviewForm.style.display = 'block';
            if (reviewSuccessMessage) reviewSuccessMessage.style.display = 'none';
            if (publicReviewForm) publicReviewForm.reset();
        });
    }

    const hideReviewModal = () => {
        if (reviewModalOverlay) reviewModalOverlay.classList.remove('open');
    };

    if (closeReviewModal) {
        closeReviewModal.addEventListener('click', hideReviewModal);
    }
    if (reviewModalOverlay) {
        reviewModalOverlay.addEventListener('click', (e) => {
            if (e.target === reviewModalOverlay) hideReviewModal();
        });
    }

    if (publicReviewForm) {
        publicReviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewName').value.trim();
            const role = document.getElementById('reviewRole').value.trim();
            const ratingInput = publicReviewForm.querySelector('input[name="reviewRating"]:checked');
            const rating = ratingInput ? parseInt(ratingInput.value) : 5;
            const review = document.getElementById('reviewContent').value.trim();

            const submitBtn = publicReviewForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

            fetch((window.API_BASE||'') + '/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, role, rating, review })
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed to submit review');
                return res.json();
            })
            .then(() => {
                publicReviewForm.style.display = 'none';
                if (reviewSuccessMessage) reviewSuccessMessage.style.display = 'block';
                loadPublicReviews(); // Re-trigger DB fetch to rebuild the slider dynamically
            })
            .catch(err => {
                console.error(err);
                alert('Failed to submit review. Please try again.');
            })
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        });
    }

    if (closeReviewSuccessBtn) {
        closeReviewSuccessBtn.addEventListener('click', hideReviewModal);
    }

    // Force page scroll to top on refresh
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    // ==========================================
    // Dynamic Fleet Loading from API
    // ==========================================
    function renderFleetCard(vehicle, index) {
        const delayClass = index === 0 ? '' : index === 1 ? 'delay-1' : index === 2 ? 'delay-2' : 'delay-3';
        const photos = vehicle.photos && vehicle.photos.length > 0 ? vehicle.photos : ['assets/innova.jpg'];
        const hasMultiple = photos.length > 1;

        // Build photo carousel or single image
        const photoHtml = hasMultiple ? `
            <div class="fleet-photo-carousel" data-current="0">
                ${photos.map((p, i) => `<img src="${p}" alt="${vehicle.name} photo ${i+1}" class="fleet-img${i === 0 ? ' active-photo' : ''}" style="display:${i===0?'block':'none'};">`).join('')}
                <button class="carousel-prev" onclick="carouselPrev(this)" style="position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);color:white;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:0.9rem;z-index:5;">&#8249;</button>
                <button class="carousel-next" onclick="carouselNext(this)" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:rgba(0,0,0,0.45);color:white;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:0.9rem;z-index:5;">&#8250;</button>
                <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;">
                    ${photos.map((_, i) => `<span class="dot${i===0?' dot-active':''}" style="width:6px;height:6px;border-radius:50%;background:${i===0?'white':'rgba(255,255,255,0.45)'};" onclick="carouselGoTo(this.parentElement.parentElement,${i})"></span>`).join('')}
                </div>
            </div>
        ` : `<img src="${photos[0]}" alt="${vehicle.name}" class="fleet-img">`;

        return `
            <div class="fleet-card animate-scroll ${delayClass}">
                <div class="card-img-container" style="position:relative;">
                    ${photoHtml}
                    <div class="card-tag">${vehicle.badge || vehicle.category}</div>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${vehicle.name}</h3>
                    <div class="card-meta">
                        <span><i class="fa-solid fa-users"></i> ${vehicle.seats}</span>
                        <span><i class="fa-solid fa-star text-gold"></i> ${vehicle.category}</span>
                    </div>
                    <p class="card-desc">${vehicle.description}</p>
                    <ul class="card-features">
                        ${vehicle.features.map(f => `<li><i class="fa-solid fa-circle-check"></i> ${f}</li>`).join('')}
                    </ul>
                    <button class="btn btn-gold btn-block btn-book-now" data-vehicle="${vehicle.name}">Select Vehicle</button>
                </div>
            </div>
        `;
    }

    // Carousel helpers (global scope)
    window.carouselNext = function(btn) {
        const carousel = btn.parentElement;
        const imgs = carousel.querySelectorAll('img');
        const dots = carousel.querySelectorAll('.dot');
        let cur = parseInt(carousel.dataset.current) || 0;
        imgs[cur].style.display = 'none';
        if (dots[cur]) dots[cur].style.background = 'rgba(255,255,255,0.45)';
        cur = (cur + 1) % imgs.length;
        imgs[cur].style.display = 'block';
        if (dots[cur]) dots[cur].style.background = 'white';
        carousel.dataset.current = cur;
    };

    window.carouselPrev = function(btn) {
        const carousel = btn.parentElement;
        const imgs = carousel.querySelectorAll('img');
        const dots = carousel.querySelectorAll('.dot');
        let cur = parseInt(carousel.dataset.current) || 0;
        imgs[cur].style.display = 'none';
        if (dots[cur]) dots[cur].style.background = 'rgba(255,255,255,0.45)';
        cur = (cur - 1 + imgs.length) % imgs.length;
        imgs[cur].style.display = 'block';
        if (dots[cur]) dots[cur].style.background = 'white';
        carousel.dataset.current = cur;
    };

    window.carouselGoTo = function(carousel, idx) {
        const imgs = carousel.querySelectorAll('img');
        const dots = carousel.querySelectorAll('.dot');
        const cur = parseInt(carousel.dataset.current) || 0;
        imgs[cur].style.display = 'none';
        if (dots[cur]) dots[cur].style.background = 'rgba(255,255,255,0.45)';
        imgs[idx].style.display = 'block';
        if (dots[idx]) dots[idx].style.background = 'white';
        carousel.dataset.current = idx;
    };

    function loadFleet() {
        const grid = document.getElementById('fleetGrid');
        if (!grid) return;

        fetch((window.API_BASE||'') + '/api/fleet')
            .then(r => r.json())
            .then(vehicles => {
                if (!vehicles || vehicles.length === 0) {
                    grid.innerHTML = '<p style="text-align:center;color:#94A3B8;padding:3rem;">No vehicles available.</p>';
                    return;
                }
                grid.innerHTML = vehicles.map((v, i) => renderFleetCard(v, i)).join('');

                // Re-attach book now button listeners
                grid.querySelectorAll('.btn-book-now').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const vehicle = btn.getAttribute('data-vehicle');
                        const modal = document.getElementById('bookingModalOverlay');
                        if (modal) {
                            modal.classList.add('active');
                            document.body.style.overflow = 'hidden';
                            const sel = document.getElementById('vehicleSelect');
                            if (sel && vehicle) {
                                for (let opt of sel.options) {
                                    if (opt.value === vehicle) { sel.value = vehicle; break; }
                                }
                            }
                        }
                    });
                });

                // Trigger scroll animations
                const newCards = grid.querySelectorAll('.animate-scroll');
                const obs = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
                    });
                }, { threshold: 0.1 });
                newCards.forEach(c => obs.observe(c));
            })
            .catch(() => {
                // Fallback: keep existing static content
                console.warn('Fleet API unavailable, using static content.');
            });
    }
    loadFleet();

    // ==========================================
    // Dynamic Contact Info Loading from API
    // ==========================================
    function loadContactInfo() {
        fetch((window.API_BASE||'') + '/api/contact-settings')
            .then(r => r.json())
            .then(data => {
                // Update phone links
                const links = document.querySelectorAll('.footer-phone-link');
                if (links[0] && data.phone1) {
                    const rawNum = data.phone1.replace(/\D/g, '');
                    links[0].href = `tel:+${rawNum}`;
                    links[0].innerHTML = `<i class="fa-solid fa-phone"></i> ${data.phone1}`;
                }
                if (links[1] && data.phone2) {
                    const rawNum = data.phone2.replace(/\D/g, '');
                    links[1].href = `tel:+${rawNum}`;
                    links[1].innerHTML = `<i class="fa-solid fa-phone"></i> ${data.phone2}`;
                }
                // Update WhatsApp
                if (data.whatsapp) {
                    const waLink = document.querySelector('.footer-socials a[aria-label="WhatsApp"]');
                    if (waLink) waLink.href = `https://wa.me/${data.whatsapp}`;
                }
                // Update social links
                if (data.facebook_url && data.facebook_url !== '#') {
                    const fb = document.querySelector('.footer-socials a[aria-label="Facebook"]');
                    if (fb) fb.href = data.facebook_url;
                }
                if (data.instagram_url && data.instagram_url !== '#') {
                    const ig = document.querySelector('.footer-socials a[aria-label="Instagram"]');
                    if (ig) ig.href = data.instagram_url;
                }
                // Update phone call icon
                const callIcon = document.querySelector('.footer-socials a[aria-label="Call Us"]');
                if (callIcon && data.phone1) {
                    callIcon.href = `tel:+${data.phone1.replace(/\D/g, '')}`;
                }
            })
            .catch(() => console.warn('Contact settings API unavailable.'));
    }
    loadContactInfo();

});

