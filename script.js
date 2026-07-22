document.addEventListener('DOMContentLoaded', () => {
    // Hero background video — respect reduced motion
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        heroVideo.pause();
        heroVideo.removeAttribute('autoplay');
    }

    // ── Funnel config (single source of truth) ──
    const FUNNEL = {
        couponCode: 'CHINAA',
        discountedPrice: 10000,
        fullPrice: 12000,
        totalDiscountSeats: 30,
        seatsRemaining: 30, // Update manually or wire to backend
        registrationDeadline: new Date('2026-07-31T23:59:59'),
        stripeExecutive: 'https://buy.stripe.com/7sY28sbJagib54yd3uew80d',
        stripeElite: 'https://buy.stripe.com/00w28saF6c1V40ubZqew80c'
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

    // ── Past retreat sliders ──
    const initPastRetreatSlider = (slider) => {
        const slides = Array.from(slider.querySelectorAll('.past-retreat-slide'));
        const prevBtn = slider.querySelector('.past-retreat-slider-prev');
        const nextBtn = slider.querySelector('.past-retreat-slider-next');
        const dotsContainer = slider.querySelector('.past-retreat-slider-dots');
        const counter = slider.querySelector('.past-retreat-slider-counter');
        if (!slides.length || !dotsContainer) return;

        let activeIndex = 0;
        let dotsRendered = false;

        const setActiveSlide = (index) => {
            const clamped = (index + slides.length) % slides.length;
            activeIndex = clamped;
            slides.forEach((slide, i) => slide.classList.toggle('is-active', i === clamped));
            dotsContainer.querySelectorAll('.past-retreat-slider-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === clamped);
            });
            if (counter) counter.textContent = `${clamped + 1} / ${slides.length}`;
        };

        const renderDots = () => {
            if (dotsRendered) return;
            dotsRendered = true;
            dotsContainer.innerHTML = '';
            slides.forEach((_, idx) => {
                const dotBtn = document.createElement('button');
                dotBtn.type = 'button';
                dotBtn.className = 'past-retreat-slider-dot';
                dotBtn.setAttribute('aria-label', `Photo ${idx + 1}`);
                dotBtn.addEventListener('click', () => setActiveSlide(idx));
                dotsContainer.appendChild(dotBtn);
            });
        };

        renderDots();
        setActiveSlide(0);
        prevBtn?.addEventListener('click', () => setActiveSlide(activeIndex - 1));
        nextBtn?.addEventListener('click', () => setActiveSlide(activeIndex + 1));
    };

    document.querySelectorAll('[data-past-retreat-slider]').forEach(initPastRetreatSlider);

    // ── Coupon copy + toast ──
    let couponToastEl = document.getElementById('coupon-toast');
    if (!couponToastEl) {
        couponToastEl = document.createElement('div');
        couponToastEl.id = 'coupon-toast';
        couponToastEl.className = 'coupon-toast';
        couponToastEl.setAttribute('role', 'status');
        couponToastEl.setAttribute('aria-live', 'polite');
        document.body.appendChild(couponToastEl);
    }

    let couponToastTimer = null;
    const showCouponToast = (message) => {
        couponToastEl.textContent = message;
        couponToastEl.classList.add('is-visible');
        clearTimeout(couponToastTimer);
        couponToastTimer = setTimeout(() => couponToastEl.classList.remove('is-visible'), 2200);
    };

    document.querySelectorAll('[data-copy-coupon]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const code = btn.getAttribute('data-copy-coupon') || FUNNEL.couponCode;
            try {
                await navigator.clipboard.writeText(code);
                showCouponToast(`Copied ${code} — paste at Stripe checkout`);
            } catch {
                showCouponToast(`Your code: ${code}`);
            }
        });
    });

    // ── Exit intent ──
    const exitIntent = document.getElementById('exit-intent');
    let exitShown = false;

    const showExitIntent = () => {
        if (exitShown || !exitIntent) return;
        exitShown = true;
        exitIntent.classList.add('is-visible');
        exitIntent.setAttribute('aria-hidden', 'false');
        trackEvent('exit_intent_shown', { event_category: 'engagement' });
    };

    const hideExitIntent = () => {
        if (!exitIntent) return;
        exitIntent.classList.remove('is-visible');
        exitIntent.setAttribute('aria-hidden', 'true');
    };

    document.querySelectorAll('[data-close-exit]').forEach(el => {
        el.addEventListener('click', hideExitIntent);
    });

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('mouseout', (e) => {
            if (e.clientY <= 0 && e.relatedTarget == null) showExitIntent();
        });
    }

    // ── Pricing modal ──
    const pricingModal = document.getElementById('pricing-modal');

    if (pricingModal) {
        const pricingCard = pricingModal.querySelector('.pricing-modal-card');
        const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
        let lastFocused = null;

        const openPricingModal = (source) => {
            if (pricingModal.classList.contains('is-visible')) return;
            lastFocused = document.activeElement;
            hideExitIntent();
            pricingModal.classList.add('is-visible');
            pricingModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            pricingCard?.scrollTo({ top: 0 });

            const firstCta = pricingModal.querySelector('.btn-pricing-cta');
            (firstCta || pricingModal.querySelector('.pricing-modal-close'))?.focus({ preventScroll: true });

            trackEvent('view_pricing_modal', {
                event_category: 'cta',
                event_label: source || 'unknown'
            });
        };

        const closePricingModal = () => {
            if (!pricingModal.classList.contains('is-visible')) return;
            pricingModal.classList.remove('is-visible');
            pricingModal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
            if (lastFocused instanceof HTMLElement) lastFocused.focus({ preventScroll: true });
        };

        // Every "Reserve / View Packages" CTA opens the modal instead of jumping to a section
        document.querySelectorAll('a[href="#pricing"], [data-open-pricing]').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                if (navLinks) navLinks.classList.remove('active');
                if (mobileBtn) {
                    const icon = mobileBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-times');
                        icon.classList.add('fa-bars');
                    }
                }
                openPricingModal(trigger.dataset.cta || trigger.textContent.trim());
            });
        });

        pricingModal.querySelectorAll('[data-close-pricing]').forEach(el => {
            el.addEventListener('click', closePricingModal);
        });

        // Close after a package is chosen so the page isn't left behind a modal
        pricingModal.querySelectorAll('.btn-pricing-cta').forEach(btn => {
            btn.addEventListener('click', () => setTimeout(closePricingModal, 150));
        });

        document.addEventListener('keydown', (e) => {
            if (!pricingModal.classList.contains('is-visible')) return;

            if (e.key === 'Escape') {
                closePricingModal();
                return;
            }

            if (e.key !== 'Tab') return;

            const focusable = Array.from(pricingModal.querySelectorAll(focusableSelector))
                .filter(el => el.offsetParent !== null);
            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });

        // Deep links (e.g. /#pricing from an email or ad) still land on the packages
        if (window.location.hash === '#pricing') {
            openPricingModal('deep-link');
        }
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
