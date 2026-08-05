document.addEventListener('DOMContentLoaded', () => {
    // Hero background video — respect reduced motion
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroVideo.pause();
        heroVideo.removeAttribute('autoplay');
    }

    // ── Funnel config (single source of truth) ──
    const FUNNEL = {
        discountedPrice: 9000,
        fullPrice: 10000,
        totalDiscountSeats: 30,
        seatsRemaining: 10, // Update manually or wire to backend
        registrationDeadline: new Date('2026-07-31T23:59:59'),
        stripeShared: 'https://buy.stripe.com/cNi7sM8wY8PJ9kOe7yew80u',
        stripePrivate: 'https://buy.stripe.com/3cI28s3cEgib68CfbCew80v'
    };

    const seatSelectors = [
        '#seats-left-hero',
        '#seats-left-pricing',
        '#seats-left-urgency',
        '#seats-left-final',
        '#seats-left-sticky',
        '#seats-left-exit'
    ];

    const updateScarcityUI = () => {
        const seats = FUNNEL.seatsRemaining;
        seatSelectors.forEach(sel => {
            const el = document.querySelector(sel);
            if (el) el.textContent = seats;
        });

        const bar = document.getElementById('seats-bar');
        const fill = document.getElementById('seats-bar-fill');
        if (bar && fill) {
            const pct = (seats / FUNNEL.totalDiscountSeats) * 100;
            fill.style.width = `${pct}%`;
            bar.setAttribute('aria-valuenow', seats);
            bar.setAttribute('aria-valuemax', FUNNEL.totalDiscountSeats);
        }
    };

    const updateCountdown = () => {
        const el = document.getElementById('countdown-days');
        if (!el) return;
        const now = new Date();
        const diff = FUNNEL.registrationDeadline - now;
        const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        el.textContent = days;
    };

    updateScarcityUI();
    updateCountdown();

    // ── Analytics / retargeting events ──
    const trackEvent = (name, params = {}) => {
        if (typeof gtag === 'function') {
            gtag('event', name, params);
        }
        if (typeof fbq === 'function') {
            fbq('trackCustom', name, params);
        }
    };

    document.querySelectorAll('.js-cta-primary').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('begin_checkout', {
                event_category: 'cta',
                event_label: btn.dataset.cta || 'primary',
                value: FUNNEL.discountedPrice,
                currency: 'USD'
            });
        });
    });

    document.querySelectorAll('.js-cta-secondary').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('begin_checkout', {
                event_category: 'cta',
                event_label: btn.dataset.cta || 'elite',
                value: 15000,
                currency: 'USD'
            });
        });
    });

    document.querySelectorAll('.js-cta-lead').forEach(btn => {
        btn.addEventListener('click', () => {
            trackEvent('generate_lead', {
                event_category: 'lead_capture',
                event_label: btn.dataset.cta || 'lead'
            });
        });
    });

    // ── Navbar scroll state ──
    const navbar = document.querySelector('.navbar');
    const setNavbarScrolled = () => {
        if (!navbar) return;
        navbar.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    setNavbarScrolled();
    window.addEventListener('scroll', setNavbarScrolled, { passive: true });

    // ── Sticky CTA bar ──
    const hero = document.querySelector('.hero');
    const stickyCta = document.getElementById('sticky-cta');
    const footer = document.querySelector('footer');

    const updateStickyCta = () => {
        if (!hero || !stickyCta) return;
        const heroEnd = hero.offsetTop + hero.offsetHeight;
        const scrollY = window.scrollY;
        let hideNearFooter = false;
        if (footer) {
            const footerTop = footer.offsetTop;
            hideNearFooter = scrollY > footerTop - window.innerHeight * 0.85;
        }
        const show = scrollY > heroEnd - 80 && !hideNearFooter;
        stickyCta.classList.toggle('is-visible', show);
        document.body.classList.toggle('sticky-cta-active', show);
        stickyCta.setAttribute('aria-hidden', show ? 'false' : 'true');
    };

    updateStickyCta();
    window.addEventListener('scroll', updateStickyCta, { passive: true });
    window.addEventListener('resize', updateStickyCta, { passive: true });

    // ── Mobile menu ──
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // ── Smooth scroll ──
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();
            if (navLinks) navLinks.classList.remove('active');
            if (mobileBtn) {
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
            target.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // ── FAQ accordion ──
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(otherItem => otherItem.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    // ── Outcomes carousel (mobile) ──
    const outcomesSection = document.querySelector('#outcomes');
    const outcomeGrid = outcomesSection ? outcomesSection.querySelector('.outcome-grid') : null;
    const outcomeNav = outcomesSection ? outcomesSection.querySelector('.outcome-carousel-nav') : null;

    if (outcomeGrid && outcomeNav) {
        const cards = Array.from(outcomeGrid.querySelectorAll('.outcome-card'));
        const prevBtn = outcomeNav.querySelector('.outcome-carousel-prev');
        const nextBtn = outcomeNav.querySelector('.outcome-carousel-next');
        const dotsContainer = outcomeNav.querySelector('.outcome-carousel-dots');
        const mq = window.matchMedia('(max-width: 768px)');
        let activeIndex = 0;
        let dotsRendered = false;
        let carouselObserver = null;

        const setActiveDot = (index) => {
            activeIndex = index;
            if (!dotsContainer) return;
            dotsContainer.querySelectorAll('.outcome-carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
        };

        const scrollToCard = (index) => {
            const clamped = Math.max(0, Math.min(index, cards.length - 1));
            cards[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        };

        const renderDots = () => {
            if (dotsRendered || !dotsContainer) return;
            dotsRendered = true;
            dotsContainer.innerHTML = '';
            cards.forEach((_, idx) => {
                const dotBtn = document.createElement('button');
                dotBtn.type = 'button';
                dotBtn.className = 'outcome-carousel-dot';
                dotBtn.setAttribute('aria-label', `Outcome ${idx + 1}`);
                dotBtn.addEventListener('click', () => { if (mq.matches) scrollToCard(idx); });
                dotsContainer.appendChild(dotBtn);
            });
            setActiveDot(0);
        };

        const attachObserver = () => {
            if (carouselObserver) carouselObserver.disconnect();
            carouselObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    const idx = cards.indexOf(entry.target);
                    if (idx >= 0) setActiveDot(idx);
                });
            }, { root: outcomeGrid, threshold: 0.6 });
            cards.forEach(card => carouselObserver.observe(card));
        };

        const enable = () => {
            if (!mq.matches) return;
            renderDots();
            attachObserver();
        };

        prevBtn?.addEventListener('click', () => { if (mq.matches) scrollToCard(activeIndex - 1); });
        nextBtn?.addEventListener('click', () => { if (mq.matches) scrollToCard(activeIndex + 1); });
        enable();
        mq.addEventListener('change', () => {
            if (!mq.matches && carouselObserver) carouselObserver.disconnect();
            enable();
        });
    }

    // ── Past retreat sliders (horizontal side-by-side) ──
    const initPastRetreatSlider = (slider) => {
        const viewport = slider.querySelector('.past-retreat-slider-viewport');
        const track = slider.querySelector('.past-retreat-slider-track');
        const slides = Array.from(slider.querySelectorAll('.past-retreat-slide'));
        const prevBtn = slider.querySelector('.past-retreat-slider-prev');
        const nextBtn = slider.querySelector('.past-retreat-slider-next');
        const dotsContainer = slider.querySelector('.past-retreat-slider-dots');
        const counter = slider.querySelector('.past-retreat-slider-counter');
        if (!viewport || !track || !slides.length || !dotsContainer) return;

        let index = 0;
        let dragStartX = 0;
        let dragDelta = 0;
        let isDragging = false;

        const getGap = () => {
            const styles = getComputedStyle(slider);
            return parseFloat(styles.getPropertyValue('--slide-gap')) || 14;
        };

        const getSlideStep = () => {
            const slideWidth = slides[0].getBoundingClientRect().width;
            return slideWidth + getGap();
        };

        const getMaxIndex = () => {
            const visible = parseFloat(getComputedStyle(slider).getPropertyValue('--slides-visible')) || 2;
            return Math.max(0, slides.length - Math.floor(visible));
        };

        const goTo = (nextIndex, { animate = true } = {}) => {
            const maxIndex = getMaxIndex();
            index = Math.max(0, Math.min(nextIndex, maxIndex));
            const offset = index * getSlideStep();

            if (!animate) track.style.transition = 'none';
            track.style.transform = `translate3d(${-offset}px, 0, 0)`;
            if (!animate) {
                // Force reflow so transition can be restored
                void track.offsetWidth;
                track.style.transition = '';
            }

            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === index);
            });
            dotsContainer.querySelectorAll('.past-retreat-slider-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
            });
            if (counter) counter.textContent = `${index + 1} / ${slides.length}`;
            if (prevBtn) prevBtn.disabled = index <= 0;
            if (nextBtn) nextBtn.disabled = index >= maxIndex;
        };

        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
            const dotBtn = document.createElement('button');
            dotBtn.type = 'button';
            dotBtn.className = 'past-retreat-slider-dot';
            dotBtn.setAttribute('aria-label', `Go to photo ${idx + 1}`);
            dotBtn.addEventListener('click', () => goTo(idx));
            dotsContainer.appendChild(dotBtn);
        });

        prevBtn?.addEventListener('click', () => goTo(index - 1));
        nextBtn?.addEventListener('click', () => goTo(index + 1));

        const onPointerDown = (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            isDragging = true;
            dragStartX = event.clientX;
            dragDelta = 0;
            viewport.classList.add('is-dragging');
            viewport.setPointerCapture?.(event.pointerId);
        };

        const onPointerMove = (event) => {
            if (!isDragging) return;
            dragDelta = event.clientX - dragStartX;
            const base = index * getSlideStep();
            track.style.transform = `translate3d(${-base + dragDelta}px, 0, 0)`;
        };

        const onPointerUp = () => {
            if (!isDragging) return;
            isDragging = false;
            viewport.classList.remove('is-dragging');
            const threshold = getSlideStep() * 0.2;
            if (dragDelta < -threshold) goTo(index + 1);
            else if (dragDelta > threshold) goTo(index - 1);
            else goTo(index);
            dragDelta = 0;
        };

        viewport.addEventListener('pointerdown', onPointerDown);
        viewport.addEventListener('pointermove', onPointerMove);
        viewport.addEventListener('pointerup', onPointerUp);
        viewport.addEventListener('pointercancel', onPointerUp);
        viewport.addEventListener('pointerleave', () => {
            if (isDragging) onPointerUp();
        });

        window.addEventListener('resize', () => goTo(index, { animate: false }));
        goTo(0, { animate: false });
    };

    document.querySelectorAll('[data-past-retreat-slider]').forEach(initPastRetreatSlider);

    // ── Exit intent package carousel (loops all packages) ──
    const exitSlider = document.querySelector('[data-exit-package-slider]');
    let exitSlideIndex = 0;
    let exitAutoTimer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initExitPackageSlider = () => {
        if (!exitSlider) return null;
        const slides = Array.from(exitSlider.querySelectorAll('.exit-intent-slide'));
        const prevBtn = exitSlider.querySelector('.exit-intent-carousel-prev');
        const nextBtn = exitSlider.querySelector('.exit-intent-carousel-next');
        const dotsContainer = exitSlider.querySelector('.exit-intent-carousel-dots');
        if (!slides.length || !dotsContainer) return null;

        dotsContainer.innerHTML = '';
        slides.forEach((_, idx) => {
            const dotBtn = document.createElement('button');
            dotBtn.type = 'button';
            dotBtn.className = 'exit-intent-carousel-dot';
            dotBtn.setAttribute('aria-label', `Package ${idx + 1}`);
            dotBtn.addEventListener('click', () => {
                setExitSlide(idx);
                restartExitAutoLoop();
            });
            dotsContainer.appendChild(dotBtn);
        });

        const setExitSlide = (index) => {
            exitSlideIndex = (index + slides.length) % slides.length;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === exitSlideIndex));
            dotsContainer.querySelectorAll('.exit-intent-carousel-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === exitSlideIndex);
            });
        };

        const stopExitAutoLoop = () => {
            clearInterval(exitAutoTimer);
            exitAutoTimer = null;
        };

        const restartExitAutoLoop = () => {
            stopExitAutoLoop();
            if (reduceMotion) return;
            exitAutoTimer = setInterval(() => setExitSlide(exitSlideIndex + 1), 4000);
        };

        prevBtn?.addEventListener('click', () => {
            setExitSlide(exitSlideIndex - 1);
            restartExitAutoLoop();
        });
        nextBtn?.addEventListener('click', () => {
            setExitSlide(exitSlideIndex + 1);
            restartExitAutoLoop();
        });

        // Pause auto-loop while user interacts with pay buttons
        exitSlider.addEventListener('pointerenter', stopExitAutoLoop);
        exitSlider.addEventListener('pointerleave', restartExitAutoLoop);

        let touchStartX = 0;
        exitSlider.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            stopExitAutoLoop();
        }, { passive: true });
        exitSlider.addEventListener('touchend', (e) => {
            const delta = e.changedTouches[0].screenX - touchStartX;
            if (Math.abs(delta) > 40) {
                setExitSlide(exitSlideIndex + (delta < 0 ? 1 : -1));
            }
            restartExitAutoLoop();
        }, { passive: true });

        setExitSlide(0);

        return { setExitSlide, restartExitAutoLoop, stopExitAutoLoop };
    };

    const exitCarousel = initExitPackageSlider();

    // ── Exit intent ──
    const exitIntent = document.getElementById('exit-intent');
    let exitShown = false;

    const showExitIntent = () => {
        if (exitShown || !exitIntent) return;
        exitShown = true;
        exitIntent.classList.add('is-visible');
        exitIntent.setAttribute('aria-hidden', 'false');
        exitCarousel?.setExitSlide(0);
        exitCarousel?.restartExitAutoLoop();
        trackEvent('exit_intent_shown', { event_category: 'engagement' });
    };

    const hideExitIntent = () => {
        if (!exitIntent) return;
        exitIntent.classList.remove('is-visible');
        exitIntent.setAttribute('aria-hidden', 'true');
        exitCarousel?.stopExitAutoLoop();
    };

    document.querySelectorAll('[data-close-exit]').forEach(el => {
        el.addEventListener('click', hideExitIntent);
    });

    if (!reduceMotion) {
        document.addEventListener('mouseout', (e) => {
            if (e.clientY <= 0 && e.relatedTarget == null) showExitIntent();
        });
    }

    // ── Scroll animations ──
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
});
