(async function() {
  'use strict';

  var data = await DB.getSiteContent();
  if (!data) return;

  var page = document.body && document.body.dataset.page;

  /* ── helpers ── */
  function text(sel, val) {
    var el = document.querySelector(sel);
    if (el && val) el.textContent = val;
  }
  function html(sel, val) {
    var el = document.querySelector(sel);
    if (el && val) el.innerHTML = val;
  }
  function attr(sel, attrName, val) {
    var el = document.querySelector(sel);
    if (el && val) el.setAttribute(attrName, val);
  }
  function styleBg(sel, url) {
    var el = document.querySelector(sel);
    if (el && url) el.style.backgroundImage = 'url(' + url + ')';
  }
  function imgSrc(sel, src) {
    var el = document.querySelector(sel);
    if (el && src) {
      el.src = src;
      el.removeAttribute('onerror');
      el.onerror = function() { this.parentElement.style.display = 'none'; };
    }
  }
  function clearAndFill(containerSel, items, fn) {
    var container = document.querySelector(containerSel);
    if (!container || !items || !items.length) return;
    container.innerHTML = '';
    items.forEach(function(item, i) {
      var el = fn(item, i);
      if (el) container.appendChild(el);
    });
  }

  function div(className) {
    var d = document.createElement('div');
    if (className) d.className = className;
    return d;
  }

  /* ── page: home (index.html) ── */
  function applyHome(d) {
    if (d.hero) {
      text('.hero-content h1', d.hero.headline);
      text('.hero-badge', d.hero.badge);
      text('.hero-btns .btn-primary', d.hero.btnText);
      styleBg('.hero-bg', d.hero.bgImage);
    }
    if (d.about) {
      text('.about-text .section-label', d.about.label);
      text('.about-text .section-title', d.about.heading);
      var paras = document.querySelectorAll('.about-text .section-sub');
      if (paras.length >= 1 && d.about.para1) paras[0].textContent = d.about.para1;
      if (paras.length >= 2 && d.about.para2) paras[1].textContent = d.about.para2;
      if (paras.length >= 3 && d.about.para3) paras[2].textContent = d.about.para3;
      if (paras.length >= 4 && d.about.para4) paras[3].textContent = d.about.para4;
      imgSrc('.about-image img', d.about.image);
      text('.about-text .about-quote', d.about.quoteText);
      text('.about-text .about-quote cite', d.about.quoteCite);
      text('.founder-note h4', d.about.founderNote);
      text('.founder-note .section-sub', d.about.founderSub);
      text('.founder-note .sign', d.about.founderSign);
    }
    if (d.services) {
      text('.services-header .section-label', d.services.label);
      text('.services-header .section-title', d.services.heading);
      text('.services-header .section-sub', d.services.subtext);
      clearAndFill('.serv-grid', d.services.items, function(item, idx) {
        var SERVICE_IMAGES = [
          'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1553882809-a4f57e595701?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1583337130417-3346a1be9de2?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1565708097881-bbf4f5c7b6d0?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80',
        ];
        var svcId = (item.title || 'svc' + idx).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        var card = div('serv-card reveal');
        card.dataset.svc = svcId;
        var img = document.createElement('img');
        img.src = SERVICE_IMAGES[idx] || SERVICE_IMAGES[0];
        img.alt = item.title || '';
        img.loading = 'lazy';
        card.appendChild(img);
        var overlay = div('serv-overlay');
        card.appendChild(overlay);
        var body = div('serv-body');
        var span = document.createElement('span');
        span.className = 'serv-icon';
        span.textContent = item.icon || 'A-1';
        var h3 = document.createElement('h3');
        h3.textContent = item.title || '';
        body.appendChild(span);
        body.appendChild(h3);
        card.appendChild(body);
        return card;
      });
    }
    if (d.whyUs) {
      text('.why-us .section-label', d.whyUs.label);
      text('.why-us .section-title', d.whyUs.heading);
      text('.why-us .section-sub', d.whyUs.subtext);
      clearAndFill('.wu-grid', d.whyUs.items, function(item) {
        var el = div('wu-item');
        var icon = div('icon');
        icon.textContent = item.icon || '⭐';
        var h4 = document.createElement('h4');
        h4.textContent = item.title || '';
        var p = document.createElement('p');
        p.textContent = item.desc || '';
        el.appendChild(icon);
        el.appendChild(h4);
        el.appendChild(p);
        return el;
      });
    }
    if (d.social) {
      clearAndFill('.wu-sr', d.social, function(item) {
        var el = div('wu-sr-item');
        var icon = div('icon');
        icon.textContent = item.icon || '🤝';
        var h4 = document.createElement('h4');
        h4.textContent = item.title || '';
        var p = document.createElement('p');
        p.textContent = item.desc || '';
        el.appendChild(icon);
        el.appendChild(h4);
        el.appendChild(p);
        return el;
      });
    }
    if (d.gallery && d.gallery.length) {
      var galGrid = document.getElementById('galleryGrid');
      if (galGrid) {
        galGrid.innerHTML = '';
        d.gallery.forEach(function(url) {
          if (!url) return;
          var item = div('gallery-item');
          var img = document.createElement('img');
          img.src = url;
          img.alt = 'Gallery';
          img.loading = 'lazy';
          img.onerror = function() { this.parentElement.style.display = 'none'; };
          var overlay = div('overlay');
          overlay.textContent = 'View';
          item.appendChild(img);
          item.appendChild(overlay);
          galGrid.appendChild(item);
        });
      }
    }
    if (d.testimonials) {
      clearAndFill('.test-grid', d.testimonials, function(item) {
        var el = div('test-card');
        var stars = div('stars');
        var n = parseInt(item.stars, 10) || 5;
        stars.textContent = '★'.repeat(n) + '☆'.repeat(5 - n);
        var q = document.createElement('blockquote');
        q.textContent = item.quote || '';
        var c = document.createElement('cite');
        c.textContent = item.name || '';
        el.appendChild(stars);
        el.appendChild(q);
        el.appendChild(c);
        return el;
      });
    }
    if (d.footer) {
      text('.footer-bottom span', d.footer.copyright);
      var fp = document.querySelector('.footer-brand p');
      if (fp && d.footer.tagline) fp.textContent = d.footer.tagline;
      var socialLinks = document.querySelectorAll('.footer-social a');
      var socialMap = { fb: 0, ig: 1, yt: 2, gm: 3 };
      if (d.footer.fb && socialLinks[socialMap.fb]) socialLinks[socialMap.fb].href = d.footer.fb;
      if (d.footer.ig && socialLinks[socialMap.ig]) socialLinks[socialMap.ig].href = d.footer.ig;
      if (d.footer.yt && socialLinks[socialMap.yt]) socialLinks[socialMap.yt].href = d.footer.yt;
      if (d.footer.gm && socialLinks[socialMap.gm]) socialLinks[socialMap.gm].href = d.footer.gm;
      var contactItems = document.querySelectorAll('.contact-item');
      if (contactItems.length >= 2) {
        var emailLink = contactItems[1].querySelector('a');
        if (emailLink && d.footer.email) emailLink.href = 'mailto:' + d.footer.email;
      }
      if (contactItems.length >= 3) {
        var waLink = contactItems[2].querySelector('a');
        if (waLink && d.footer.whatsapp) waLink.href = d.footer.whatsapp;
      }
    }
  }

  /* ── page: train (training.html) ── */
  function applyTrain(d) {
    var s = d.training;
    if (!s) return;
    if (s.hero) {
      text('.page-hero h1', s.hero.heading);
      text('.page-hero p', s.hero.subtext);
      styleBg('.page-hero', s.hero.bgImage);
    }
    if (s.programs) {
      text('.content-section .container .section-label', s.programs.label);
      var titles = document.querySelectorAll('.content-section .container .section-title');
      if (titles.length >= 1) titles[0].innerHTML = s.programs.title;
      var subs = document.querySelectorAll('.content-section .container .section-sub');
      if (subs.length >= 1) subs[0].textContent = s.programs.subtext;
      if (s.programs.items && s.programs.items.length) {
        console.log('[Content] Rendering ' + s.programs.items.length + ' program cards');
        clearAndFill('.programs', s.programs.items, function(item) {
          var card = div('program-card');
          var imgDiv = div('card-img');
          if (item.img) {
            var img = document.createElement('img');
            img.src = item.img;
            img.alt = item.title || '';
            img.loading = 'lazy';
            img.onerror = function() { this.parentElement.style.display = 'none'; };
            imgDiv.appendChild(img);
          }
          var icon = div('icon');
          icon.textContent = item.icon || '🐾';
          var h3 = document.createElement('h3');
          h3.textContent = item.title || '';
          var p = document.createElement('p');
          p.textContent = item.desc || '';
          card.appendChild(imgDiv);
          card.appendChild(icon);
          card.appendChild(h3);
          card.appendChild(p);
          return card;
        });
        console.log('[Content] Programs container now has ' + document.querySelector('.programs').children.length + ' children');
      }
    }
    if (s.gallery) {
      var galContainers = document.querySelectorAll('.content-section .container');
      if (galContainers.length >= 2) {
        var glabels = galContainers[1].querySelectorAll('.section-label');
        if (glabels.length) glabels[0].textContent = s.gallery.label;
        var gtitles = galContainers[1].querySelectorAll('.section-title');
        if (gtitles.length) gtitles[0].textContent = s.gallery.title;
        var gsubs = galContainers[1].querySelectorAll('.section-sub');
        if (gsubs.length) gsubs[0].textContent = s.gallery.subtext;
      }
      if (s.gallery.images && s.gallery.images.length) {
        var gal = document.querySelector('.train-gal');
        if (gal) {
          gal.innerHTML = '';
          s.gallery.images.forEach(function(url) {
            if (!url) return;
            var item = div('gal-item');
            var img = document.createElement('img');
            img.src = url;
            img.alt = 'Training session';
            img.loading = 'lazy';
            img.onerror = function() { this.style.display = 'none'; this.parentElement.style.background = 'linear-gradient(135deg,var(--gold-light),var(--gold))'; };
            item.appendChild(img);
            gal.appendChild(item);
          });
        }
      }
    }
    if (s.process) {
      var procs = document.querySelectorAll('.content-section .container');
      if (procs.length >= 3) {
        var plabels = procs[2].querySelectorAll('.section-label');
        if (plabels.length) plabels[0].textContent = s.process.label;
        var ptitles = procs[2].querySelectorAll('.section-title');
        if (ptitles.length) ptitles[0].textContent = s.process.title;
        var psubs = procs[2].querySelectorAll('.section-sub');
        if (psubs.length) psubs[0].textContent = s.process.subtext;
      }
      if (s.process.steps) {
        clearAndFill('.process-grid', s.process.steps, function(item) {
          var step = div('process-step');
          var num = div('step-num');
          num.textContent = item.num || '';
          var h4 = document.createElement('h4');
          h4.textContent = item.title || '';
          var p = document.createElement('p');
          p.textContent = item.desc || '';
          step.appendChild(num);
          step.appendChild(h4);
          step.appendChild(p);
          return step;
        });
      }
    }
    if (s.approach) {
      var approachLabel = document.querySelector('.approach-grid .section-label');
      if (approachLabel && s.approach.label) approachLabel.textContent = s.approach.label;
      var approachTitle = document.querySelector('.approach-grid .section-title');
      if (approachTitle && s.approach.title) approachTitle.innerHTML = s.approach.title;
      var approachParas = document.querySelectorAll('.approach-grid .section-sub');
      if (approachParas.length >= 1 && s.approach.para1) approachParas[0].textContent = s.approach.para1;
      if (approachParas.length >= 2 && s.approach.para2) approachParas[1].textContent = s.approach.para2;
      if (s.approach.benefits) {
        var benefitsList = document.querySelector('.benefits');
        if (benefitsList) {
          benefitsList.innerHTML = '';
          s.approach.benefits.forEach(function(b) {
            var li = document.createElement('li');
            var ck = document.createElement('span');
            ck.className = 'ck';
            ck.textContent = '✓';
            li.appendChild(ck);
            li.appendChild(document.createTextNode(' ' + b));
            benefitsList.appendChild(li);
          });
        }
      }
      imgSrc('.approach-image img', s.approach.image);
    }
    if (s.cta) {
      text('.cta-section h2', s.cta.heading);
      text('.cta-section p', s.cta.subtext);
      text('.cta-section .btn-whatsapp', s.cta.btnText);
      attr('.cta-section .btn-whatsapp', 'href', s.cta.btnLink);
    }
    if (s.footer) {
      text('footer .footer-inner > span', s.footer.copyright);
    }
  }

  /* ── page: groom (grooming.html) ── */
  function applyGroom(d) {
    var s = d.grooming;
    if (!s) return;
    if (s.hero) {
      text('.hero .hero-badge', s.hero.badge);
      var h1 = document.querySelector('.hero h1');
      if (h1) {
        h1.innerHTML = (s.hero.headingMain || '') + '<br>';
        var em = h1.querySelector('em');
        if (!em) { em = document.createElement('em'); h1.appendChild(em); }
        em.textContent = s.hero.headingEm || '';
      }
      text('.hero p', s.hero.subtext);
      text('#heroBtn', s.hero.btnText);
      attr('video.hero-bg', 'poster', s.hero.posterUrl);
      var source = document.querySelector('video.hero-bg source');
      if (source) source.src = s.hero.videoUrl;
      if (source) source.parentElement.load();
    }
    if (s.about) {
      imgSrc('.about-image-wrap img', s.about.image);
      var welcomeTitle = document.querySelector('.about-image-wrap .section-title');
      if (welcomeTitle && s.about.welcomeHeading) welcomeTitle.textContent = s.about.welcomeHeading;
      var welcomePara = document.querySelector('.about-image-wrap .section-title + p');
      if (welcomePara && s.about.welcomePara) welcomePara.textContent = s.about.welcomePara;
      if (s.about.hours && s.about.hours.length) {
        var hoursCard = document.getElementById('hoursCard');
        if (hoursCard) {
          hoursCard.innerHTML = '';
          s.about.hours.forEach(function(h) {
            var dSpan = document.createElement('span');
            dSpan.className = 'day';
            dSpan.textContent = h.day || '';
            var tSpan = document.createElement('span');
            tSpan.className = 'time';
            tSpan.textContent = h.time || '';
            hoursCard.appendChild(dSpan);
            hoursCard.appendChild(tSpan);
          });
        }
      }
      if (s.about.stats && s.about.stats.length) {
        var statsRow = document.querySelector('.stats-row');
        if (statsRow) {
          statsRow.innerHTML = '';
          s.about.stats.forEach(function(st) {
            var item = div('stat-item');
            var num = div('num');
            num.textContent = st.num || '';
            var label = div('label');
            label.textContent = st.label || '';
            item.appendChild(num);
            item.appendChild(label);
            statsRow.appendChild(item);
          });
        }
      }
    }
    if (s.services) {
      text('.serv-badge', s.services.badge);
      text('.serv-heading', s.services.heading);
      text('.serv-desc', s.services.desc);
      text('.serv-btn', s.services.btnText);
      if (s.services.items) {
        clearAndFill('.serv-cards', s.services.items, function(item) {
          var card = div('serv-card');
          var img = document.createElement('img');
          img.src = item.img || '';
          img.alt = item.label || '';
          img.loading = 'lazy';
          img.onerror = function() { this.parentElement.style.display = 'none'; };
          var grad = div('gradient');
          var arrow = div('card-arrow');
          arrow.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
          var label = div('card-label');
          label.textContent = item.label || '';
          card.appendChild(img);
          card.appendChild(grad);
          card.appendChild(arrow);
          card.appendChild(label);
          return card;
        });
      }
    }
    if (s.gallery) {
      text('.slider-section .section-title', s.gallery.title);
      text('.slider-section .section-sub', s.gallery.subtext);
      if (s.gallery.images && s.gallery.images.length) {
        var track = document.querySelector('.slider-track');
        if (track) {
          track.innerHTML = '';
          var allImgs = s.gallery.images.concat(s.gallery.images);
          allImgs.forEach(function(url, i) {
            if (!url) return;
            var item = div('slider-item');
            var img = document.createElement('img');
            img.src = url;
            img.alt = 'Gallery ' + ((i % s.gallery.images.length) + 1);
            img.loading = 'lazy';
            item.appendChild(img);
            track.appendChild(item);
          });
        }
      }
    }
    if (s.reviews) {
      text('.reviews-header .badge', s.reviews.badge);
      text('.reviews-header h2', s.reviews.heading);
      text('.reviews-header .sub', s.reviews.subtext);
      attr('.reviews-section .bg-img', 'src', s.reviews.bgImage);
      if (s.reviews.items) {
        clearAndFill('.reviews-grid', s.reviews.items, function(item) {
          var card = div('review-card');
          var name = div('name');
          name.textContent = item.name || '';
          var stars = div('stars');
          stars.textContent = item.stars || '★★★★★';
          var textEl = div('text');
          textEl.textContent = item.text || '';
          card.appendChild(name);
          card.appendChild(stars);
          card.appendChild(textEl);
          return card;
        });
      }
    }
    if (s.cta) {
      text('.cta h2', s.cta.heading);
      text('.cta p', s.cta.subtext);
      text('#ctaBtn', s.cta.btnText);
    }
    if (s.footer) {
      var fbCol = document.querySelector('footer > div > div:first-child');
      if (fbCol) {
        var h = fbCol.querySelector('div:first-child');
        if (h && s.footer.brand) h.textContent = s.footer.brand;
        var fp = fbCol.querySelector('p');
        if (fp && s.footer.tagline) fp.textContent = s.footer.tagline;
      }
      var fSocial = document.querySelectorAll('footer a[href*="facebook"], footer a[href*="instagram"], footer a[href*="youtu"], footer a[href*="g.co"]');
      var fMap = { fb: 0, ig: 1, yt: 2, gm: 3 };
      if (s.footer.fb && fSocial[fMap.fb]) fSocial[fMap.fb].href = s.footer.fb;
      if (s.footer.ig && fSocial[fMap.ig]) fSocial[fMap.ig].href = s.footer.ig;
      if (s.footer.yt && fSocial[fMap.yt]) fSocial[fMap.yt].href = s.footer.yt;
      if (s.footer.gm && fSocial[fMap.gm]) fSocial[fMap.gm].href = s.footer.gm;
      var copyright = document.querySelector('footer');
      if (copyright && s.footer.copyright) {
        var allText = copyright.textContent || '';
        var cpEl = Array.from(copyright.querySelectorAll('*')).filter(function(el) { return el.textContent.indexOf('©') !== -1; });
        if (cpEl.length) cpEl[0].textContent = s.footer.copyright;
      }
    }
  }

  /* ── page: board (boarding.html) ── */
  function applyBoard(d) {
    var s = d.boarding;
    if (!s) return;
    if (s.hero) {
      text('.page-hero h1', s.hero.heading);
      text('.page-hero p', s.hero.subtext);
      styleBg('.page-hero', s.hero.bgImage);
    }
    if (s.features) {
      text('.content-section .container .section-label', s.features.label);
      var titles = document.querySelectorAll('.content-section .container .section-title');
      if (titles.length >= 1) titles[0].innerHTML = s.features.title;
      var subs = document.querySelectorAll('.content-section .container .section-sub');
      if (subs.length >= 1) subs[0].textContent = s.features.subtext;
      if (s.features.items) {
        clearAndFill('.features-grid', s.features.items, function(item) {
          var card = div('feature-card');
          var icon = div('icon');
          icon.textContent = item.icon || '🏠';
          var h3 = document.createElement('h3');
          h3.textContent = item.title || '';
          var p = document.createElement('p');
          p.textContent = item.desc || '';
          card.appendChild(icon);
          card.appendChild(h3);
          card.appendChild(p);
          return card;
        });
      }
    }
    if (s.details) {
      text('.details-grid .section-label', s.details.label);
      text('.details-grid .section-title', s.details.title);
      text('.details-grid .section-sub', s.details.paragraph);
      imgSrc('.details-image img', s.details.image);
      if (s.details.detailsList) {
        var dl = document.querySelector('.details-list');
        if (dl) {
          dl.innerHTML = '';
          s.details.detailsList.forEach(function(item) {
            var li = document.createElement('li');
            li.textContent = item;
            dl.appendChild(li);
          });
        }
      }
      text('.details-grid .btn-primary', s.details.btnText);
    }
    if (s.cta) {
      text('.cta-section h2', s.cta.heading);
      text('.cta-section p', s.cta.subtext);
      text('.cta-section .btn-whatsapp', s.cta.btnText);
      attr('.cta-section .btn-whatsapp', 'href', s.cta.btnLink);
    }
    if (s.footer) {
      text('footer .footer-inner > span', s.footer.copyright);
    }
  }

  /* ── page: eco (eco-cottages.html) ── */
  function applyEco(d) {
    var s = d.eco;
    if (!s) return;
    if (s.hero) {
      text('.page-hero h1', s.hero.heading);
      text('.page-hero p', s.hero.subtext);
      styleBg('.page-hero', s.hero.bgImage);
    }
    if (s.features) {
      text('.content-section .container .section-label', s.features.label);
      var titles = document.querySelectorAll('.content-section .container .section-title');
      if (titles.length >= 1) titles[0].innerHTML = s.features.title;
      var subs = document.querySelectorAll('.content-section .container .section-sub');
      if (subs.length >= 1) subs[0].textContent = s.features.subtext;
      if (s.features.items) {
        clearAndFill('.features-grid', s.features.items, function(item) {
          var card = div('feature-card');
          var icon = div('icon');
          icon.textContent = item.icon || '🏡';
          var h3 = document.createElement('h3');
          h3.textContent = item.title || '';
          var p = document.createElement('p');
          p.textContent = item.desc || '';
          card.appendChild(icon);
          card.appendChild(h3);
          card.appendChild(p);
          return card;
        });
      }
    }
    if (s.gallery) {
      var galContainers = document.querySelectorAll('.content-section .container');
      if (galContainers.length >= 2) {
        var glabels = galContainers[1].querySelectorAll('.section-label');
        if (glabels.length) glabels[0].textContent = s.gallery.label;
        var gtitles = galContainers[1].querySelectorAll('.section-title');
        if (gtitles.length) gtitles[0].textContent = s.gallery.title;
        var gsubs = galContainers[1].querySelectorAll('.section-sub');
        if (gsubs.length) gsubs[0].textContent = s.gallery.subtext;
      }
      if (s.gallery.images && s.gallery.images.length) {
        var gal = document.querySelector('.eco-gal');
        if (gal) {
          gal.innerHTML = '';
          s.gallery.images.forEach(function(url) {
            if (!url) return;
            var item = div('gal-item');
            var img = document.createElement('img');
            img.src = url;
            img.alt = 'Eco cottage';
            img.loading = 'lazy';
            img.onerror = function() { this.style.display = 'none'; this.parentElement.style.background = 'linear-gradient(135deg,var(--gold-light),var(--gold))'; };
            item.appendChild(img);
            gal.appendChild(item);
          });
        }
      }
    }
    if (s.details) {
      var detailContainers = document.querySelectorAll('.content-section .container');
      if (detailContainers.length >= 3) {
        var dlabels = detailContainers[2].querySelectorAll('.section-label');
        if (dlabels.length) dlabels[0].textContent = s.details.label;
        var dtitles = detailContainers[2].querySelectorAll('.section-title');
        if (dtitles.length) dtitles[0].innerHTML = s.details.title;
        var dsubs = detailContainers[2].querySelectorAll('.section-sub');
        if (dsubs.length >= 1 && s.details.paragraph) dsubs[0].textContent = s.details.paragraph;
        if (dsubs.length >= 2 && s.details.para2) dsubs[1].textContent = s.details.para2;
      }
      if (s.details.featuresList) {
        var fl = document.querySelector('.features-list');
        if (fl) {
          fl.innerHTML = '';
          s.details.featuresList.forEach(function(item) {
            var li = document.createElement('li');
            var ck = document.createElement('span');
            ck.className = 'ck';
            ck.textContent = '✓';
            li.appendChild(ck);
            li.appendChild(document.createTextNode(' ' + item));
            fl.appendChild(li);
          });
        }
      }
      imgSrc('.details-image img', s.details.image);
    }
    if (s.cta) {
      text('.cta-section h2', s.cta.heading);
      text('.cta-section p', s.cta.subtext);
      text('.cta-section .btn-whatsapp', s.cta.btnText);
      attr('.cta-section .btn-whatsapp', 'href', s.cta.btnLink);
    }
    if (s.footer) {
      text('footer .footer-inner > span', s.footer.copyright);
    }
  }

  /* ── dispatch ── */
  switch (page) {
    case 'home':  applyHome(data);  break;
    case 'train': applyTrain(data); break;
    case 'groom': applyGroom(data); break;
    case 'board': applyBoard(data); break;
    case 'eco':   applyEco(data);   break;
    /* store: no content sections yet */
    default: break;
  }

  /* ── Observe newly-added reveal elements ── */
  var ro = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('active');
        ro.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.active)').forEach(function(el) { ro.observe(el); });
})();
