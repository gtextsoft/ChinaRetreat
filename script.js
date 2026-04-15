document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll state
    const navbar = document.querySelector('.navbar');
    const setNavbarScrolled = () => {
        if (!navbar) return;
        navbar.classList.toggle('is-scrolled', window.scrollY > 16);
    };
    setNavbarScrolled();
    window.addEventListener('scroll', setNavbarScrolled, { passive: true });

    // Sticky booking bar (after hero, hide near footer)
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
        const show = scrollY > heroEnd - 100 && !hideNearFooter;
        stickyCta.classList.toggle('is-visible', show);
        document.body.classList.toggle('sticky-cta-active', show);
        stickyCta.setAttribute('aria-hidden', show ? 'false' : 'true');
    };

    updateStickyCta();
    window.addEventListener('scroll', updateStickyCta, { passive: true });
    window.addEventListener('resize', updateStickyCta, { passive: true });

    // Mobile Menu Toggle
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

    // Smooth scrolling for in-page anchors
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

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            // Toggle current item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Outcomes Carousel (mobile)
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
            const dots = Array.from(dotsContainer.querySelectorAll('.outcome-carousel-dot'));
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
        };

        const scrollToCard = (index) => {
            const clamped = Math.max(0, Math.min(index, cards.length - 1));
            cards[clamped]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
        };

        const renderDots = () => {
            if (dotsRendered) return;
            dotsRendered = true;

            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';

            cards.forEach((_, idx) => {
                const dotBtn = document.createElement('button');
                dotBtn.type = 'button';
                dotBtn.className = 'outcome-carousel-dot';
                dotBtn.setAttribute('aria-label', `Outcome ${idx + 1}`);
                dotBtn.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
                dotBtn.addEventListener('click', () => {
                    if (!mq.matches) return;
                    scrollToCard(idx);
                });
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
            }, {
                root: outcomeGrid,
                threshold: 0.6
            });

            cards.forEach(card => carouselObserver.observe(card));
        };

        const enable = () => {
            if (!mq.matches) return;
            renderDots();
            attachObserver();
        };

        // Prev / Next
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!mq.matches) return;
                scrollToCard(activeIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!mq.matches) return;
                scrollToCard(activeIndex + 1);
            });
        }

        // Initial + resize handling
        enable();
        mq.addEventListener('change', () => {
            if (!mq.matches && carouselObserver) carouselObserver.disconnect();
            enable();
        });
    }

    // Who For Carousel (mobile)
    const whoSection = document.querySelector('.who-for');
    const whoGrid = whoSection ? whoSection.querySelector('.who-grid') : null;
    const whoNav = whoSection ? whoSection.querySelector('.who-carousel-nav') : null;

    if (whoGrid && whoNav) {
        const cards = Array.from(whoGrid.querySelectorAll('.who-card'));
        const prevBtn = whoNav.querySelector('.who-carousel-prev');
        const nextBtn = whoNav.querySelector('.who-carousel-next');
        const dotsContainer = whoNav.querySelector('.who-carousel-dots');

        const mq = window.matchMedia('(max-width: 1024px)');
        let activeIndex = 0;
        let dotsRendered = false;
        let initialized = false;

        const setActiveDot = (index) => {
            activeIndex = index;
            if (!dotsContainer) return;
            const dots = Array.from(dotsContainer.querySelectorAll('.who-carousel-dot'));
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === index);
                dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            });
        };

        const setActiveCard = (index) => {
            const clamped = Math.max(0, Math.min(index, cards.length - 1));
            activeIndex = clamped;

            cards.forEach((card, i) => {
                const isActive = i === clamped;
                card.classList.toggle('active', isActive);

                // Ensure the card is visible even if the global scroll-fade observer didn't run.
                if (isActive) {
                    card.classList.add('fade-in');
                    card.style.opacity = '1';
                }
            });

            setActiveDot(clamped);
        };

        const renderDots = () => {
            if (dotsRendered) return;
            dotsRendered = true;

            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';

            cards.forEach((_, idx) => {
                const dotBtn = document.createElement('button');
                dotBtn.type = 'button';
                dotBtn.className = 'who-carousel-dot';
                dotBtn.setAttribute('aria-label', `Profile ${idx + 1}`);
                dotBtn.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
                dotBtn.addEventListener('click', () => {
                    if (!mq.matches) return;
                    setActiveCard(idx);
                });
                dotsContainer.appendChild(dotBtn);
            });

            setActiveCard(0);
        };

        const enable = () => {
            if (!mq.matches) return;
            renderDots();
            if (!initialized) {
                initialized = true;
                setActiveCard(0);
            }
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!mq.matches) return;
                setActiveCard(activeIndex - 1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!mq.matches) return;
                setActiveCard(activeIndex + 1);
            });
        }

        enable();
        mq.addEventListener('change', () => {
            if (!mq.matches) {
                // Restore all cards on desktop/tablet-large.
                cards.forEach(card => card.classList.remove('active'));
                return;
            }
            enable();
        });
    }

    // Scroll Animation (Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0'; // Initial state
        observer.observe(el);
    });

    // If a carousel is already showing a slide, ensure its card isn't stuck at opacity 0.
    document.querySelectorAll('.who-for .who-card.active').forEach(card => {
        card.classList.add('fade-in');
        card.style.opacity = '1';
    });
});
