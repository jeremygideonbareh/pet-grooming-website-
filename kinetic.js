(function() {
  'use strict';

  function splitChars(el) {
    var text = el.textContent;
    el.textContent = '';
    var chars = text.split('');
    for (var i = 0; i < chars.length; i++) {
      var span = document.createElement('span');
      span.textContent = chars[i] === ' ' ? '\u00A0' : chars[i];
      span.style.display = 'inline-block';
      el.appendChild(span);
    }
    return el.children;
  }

  function splitWords(el) {
    var text = el.textContent;
    el.textContent = '';
    var words = text.split(/\s+/);
    for (var i = 0; i < words.length; i++) {
      var span = document.createElement('span');
      span.textContent = words[i];
      span.style.display = 'inline-block';
      span.style.whiteSpace = 'nowrap';
      el.appendChild(span);
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
    }
    return el.querySelectorAll('span');
  }

  window.Kinetic = {
    charReveal: function(el, opts) {
      opts = opts || {};
      var chars = splitChars(el);
      gsap.from(chars, {
        y: opts.y || 30,
        opacity: 0,
        rotateX: opts.rotateX || 0,
        duration: opts.duration || 0.6,
        stagger: opts.stagger || 0.03,
        ease: opts.ease || 'power3.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger || null
      });
    },

    wordReveal: function(el, opts) {
      opts = opts || {};
      var words = splitWords(el);
      gsap.from(words, {
        y: opts.y || 20,
        opacity: 0,
        filter: opts.blur ? 'blur(4px)' : 'none',
        duration: opts.duration || 0.7,
        stagger: opts.stagger || 0.08,
        ease: opts.ease || 'power2.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger || null
      });
    },

    typewriter: function(el, text, opts) {
      opts = opts || {};
      el.textContent = '';
      var chars = text.split('');
      var i = 0;
      var cursor = document.createElement('span');
      cursor.className = 'kinetic-cursor';
      cursor.textContent = '|';
      el.appendChild(cursor);
      var interval = setInterval(function() {
        if (i < chars.length) {
          el.insertBefore(document.createTextNode(chars[i]), cursor);
          i++;
        } else {
          clearInterval(interval);
          if (!opts.keepCursor) {
            setTimeout(function() { cursor.style.opacity = '0'; }, 1000);
          }
        }
      }, opts.speed || 40);
    },

    countUp: function(el, target, opts) {
      opts = opts || {};
      var obj = { val: 0 };
      gsap.to(obj, {
        val: target,
        duration: opts.duration || 1.5,
        ease: opts.ease || 'power2.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger || null,
        onUpdate: function() {
          el.textContent = (opts.prefix || '') + Math.round(obj.val) + (opts.suffix || '');
        }
      });
    },

    staggerChildren: function(container, childSelector, opts) {
      opts = opts || {};
      var children = container.querySelectorAll(childSelector);
      gsap.from(children, {
        y: opts.y || 40,
        opacity: 0,
        scale: opts.scale || 1,
        duration: opts.duration || 0.6,
        stagger: opts.stagger || 0.1,
        ease: opts.ease || 'power3.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger || null
      });
    },

    fadeSlide: function(el, opts) {
      opts = opts || {};
      gsap.from(el, {
        y: opts.y || 50,
        opacity: 0,
        duration: opts.duration || 0.8,
        ease: opts.ease || 'power2.out',
        delay: opts.delay || 0,
        scrollTrigger: opts.scrollTrigger || null
      });
    },

    revealSection: function(selector, opts) {
      opts = opts || {};
      var els = document.querySelectorAll(selector);
      els.forEach(function(el) {
        gsap.fromTo(el, {opacity: 0, y: opts.y || 60}, {
          y: 0,
          opacity: 1,
          duration: opts.duration || 0.9,
          ease: opts.ease || 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
            once: true
          }
        });
      });
    }
  };
})();
