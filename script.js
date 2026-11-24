/* =========================================================
   FindYourPeople – vanilla JS
   Routes (hash-based, so the back button and shared links work):
     #/                     Home
     #/societies[/<Interest>]  Society finder (optionally pre-filtered)
     #/society/<id>         Society detail
     #/courses              Courses & careers finder
     #/course/<id>          Course detail
     #/careers              Careers help (MyHub)
   No cookies, no localStorage, no tracking.
   AI-assisted: first draft generated with Claude (Anthropic).
   ========================================================= */

(function () {
  "use strict";

  const DATA_URL = "data.json";
  const SITE_NAME = "FindYourPeople";
  const INTERESTS = ["Sport", "Music", "Arts", "Academic", "Culture", "Volunteering"];
  const INTEREST_EMOJI = { Sport: "⚽", Music: "🎵", Arts: "🎨", Academic: "📚", Culture: "🌍", Volunteering: "🤝" };
  const AWARD_NAMES = {
    "BSc (Hons)": "Bachelor of Science with Honours",
    "BA (Hons)": "Bachelor of Arts with Honours",
    "LLB (Hons)": "Bachelor of Laws with Honours",
  };

  // ---------- DOM ----------
  const $ = (sel) => document.querySelector(sel);
  const views = {
    home:     $("#home-view"),
    societies:$("#list-view"),
    society:  $("#detail-view"),
    courses:  $("#courses-view"),
    course:   $("#course-detail-view"),
    careers:  $("#careers-view"),
  };
  const navSection = { home: "home", societies: "societies", society: "societies", courses: "courses", course: "courses", careers: "careers" };
  const viewTitles = {
    home: SITE_NAME,
    societies: `Societies & events – ${SITE_NAME}`,
    courses: `Courses & careers – ${SITE_NAME}`,
    careers: `Careers help – ${SITE_NAME}`,
  };
  const viewHeadings = { home: "#home-heading", societies: "#search-heading", courses: "#courses-heading", careers: "#careers-heading" };

  const form         = $("#filters");
  const societyList  = $("#society-list");
  const eventList    = $("#event-list");
  const resultsCount = $("#results-count");
  const courseForm   = $("#course-filters");
  const courseList   = $("#course-list");
  const courseCount  = $("#course-count");

  // ---------- State ----------
  let societies = [], events = [], courses = [];
  let societyById = new Map(), courseById = new Map();
  let lastSocietyId = null, lastCourseId = null;
  let currentView = null;
  const timers = {};

  // ---------- Helpers ----------
  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function parseDate(iso) {           // "YYYY-MM-DD" as a LOCAL date
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function startOfToday() {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }
  const fmt = {
    dow:  new Intl.DateTimeFormat("en-GB", { weekday: "short" }),
    day:  new Intl.DateTimeFormat("en-GB", { day: "numeric" }),
    mon:  new Intl.DateTimeFormat("en-GB", { month: "short" }),
    long: new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    weekday: new Intl.DateTimeFormat("en-GB", { weekday: "long" }),
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const societyUrl = (id) => `#/society/${encodeURIComponent(id)}`;
  const courseUrl  = (id) => `#/course/${encodeURIComponent(id)}`;
  const extLink = (href, text) =>
    `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer">${text}<span class="sr-only"> (opens in a new tab)</span></a>`;

  function matchesText(parts, q) {
    if (!q) return true;
    const hay = parts.join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  }
  /** Update a live region after a short pause so screen readers aren't flooded while typing. */
  function announce(el, text, now = false) {
    clearTimeout(timers[el.id]);
    if (now) el.textContent = text;
    else timers[el.id] = setTimeout(() => { el.textContent = text; }, 350);
  }
  function upcomingEvents() {
    const today = startOfToday();
    return events
      .filter((e) => parseDate(e.date) >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  // ---------- Shared templates ----------
  function eventItem(e, { showHost = true } = {}) {
    const d = parseDate(e.date);
    const host = societyById.get(e.societyId);
    const hostLine = showHost && host
      ? `<p class="event-host">Hosted by <a href="${societyUrl(host.id)}">${esc(host.name)}</a></p>` : "";
    return `
      <li class="event">
        <div class="event-date" aria-hidden="true">
          <span class="dow">${esc(fmt.dow.format(d))}</span>
          <span class="dnum">${esc(fmt.day.format(d))}</span>
          <span class="mon">${esc(fmt.mon.format(d))}</span>
        </div>
        <div>
          <h3>${esc(e.title)}</h3>
          <p><time datetime="${esc(e.date)}T${esc(e.time)}">${esc(fmt.long.format(d))}, ${esc(e.time)}</time>
             · ${esc(e.location)}, ${esc(e.campus)} campus</p>
          <p>${esc(e.description)}</p>
          ${hostLine}
        </div>
      </li>`;
  }

  function interestBadge(interest) {
    return `<span class="badge"><span aria-hidden="true">${INTEREST_EMOJI[interest] || ""}</span> ${esc(interest)}</span>`;
  }

  // ---------- Home ----------
  function renderHome() {
    const next = upcomingEvents().slice(0, 3);
    $("#home-events").innerHTML = next.map((e) => eventItem(e)).join("");
    $("#home-no-events").hidden = next.length > 0;
    $("#stat-societies").textContent = String(societies.length);
  }

  // ---------- Societies ----------
  function getFilters() {
    const fd = new FormData(form);
    return {
      q: String(fd.get("search") || "").trim().toLowerCase(),
      interest: String(fd.get("interest") || ""),
      campus: String(fd.get("campus") || ""),
      day: String(fd.get("day") || ""),
    };
  }

  function filterSocieties(f) {
    return societies.filter((s) =>
      (!f.interest || s.interest === f.interest) &&
      (!f.campus || s.campus === f.campus) &&
      (!f.day || s.day === f.day) &&
      matchesText([s.name, s.summary, s.description, s.interest, s.campus, ...(s.tags || [])], f.q));
  }

  function filterEvents(f) {
    return upcomingEvents().filter((e) => {
      const host = societyById.get(e.societyId);
      return (
        (!f.interest || (host && host.interest === f.interest)) &&
        (!f.campus || e.campus === f.campus) &&
        (!f.day || fmt.weekday.format(parseDate(e.date)) === f.day) &&
        matchesText([e.title, e.description, e.location, host ? host.name : "", ...(host?.tags || [])], f.q));
    });
  }

  function societyCard(s) {
    return `
      <li>
        <article class="card">
          <div>${interestBadge(s.interest)}</div>
          <h3><a href="${societyUrl(s.id)}" data-society-id="${esc(s.id)}">${esc(s.name)}</a></h3>
          <p class="card-summary">${esc(s.summary)}</p>
          <ul class="meta" aria-label="Meeting details">
            <li><span aria-hidden="true">📅</span> ${esc(s.day)}s, ${esc(s.time)}</li>
            <li><span aria-hidden="true">📍</span> ${esc(s.campus)} campus</li>
          </ul>
        </article>
      </li>`;
  }

  function renderSocieties({ announceNow = false } = {}) {
    const f = getFilters();
    const list = filterSocieties(f);
    const evs = filterEvents(f);

    societyList.innerHTML = list.map(societyCard).join("");
    $("#no-results").hidden = list.length > 0;
    eventList.innerHTML = evs.map((e) => eventItem(e)).join("");
    $("#no-events").hidden = evs.length > 0;
    $("#events-count").textContent = plural(evs.length, "event", "events");

    const filtered = f.q || f.interest || f.campus || f.day;
    announce(resultsCount, filtered
      ? `${plural(list.length, "society", "societies")} found`
      : `Showing all ${plural(list.length, "society", "societies")}`, announceNow);
  }

  function setInterest(value) {
    const v = INTERESTS.includes(value) ? value : "";
    form.querySelectorAll('input[name="interest"]').forEach((r) => { r.checked = r.value === v; });
  }

  function renderSocietyDetail(id) {
    const s = societyById.get(id);
    const el = views.society;
    if (!s) {
      el.innerHTML = notFound("society", "#/societies", "Browse all societies");
      document.title = `Not found – ${SITE_NAME}`;
      return;
    }
    const upcoming = upcomingEvents().filter((e) => e.societyId === s.id);
    const tags = (s.tags || []).map((t) => `<li>${esc(t)}</li>`).join("");
    const relatedCourses = courses.filter((c) => (c.relatedSocieties || []).includes(s.id));

    el.innerHTML = `
      <a class="back-link" href="#/societies"><span aria-hidden="true">←</span> All societies</a>
      <div class="detail-card">
        ${interestBadge(s.interest)}
        <h1 id="detail-name" tabindex="-1">${esc(s.name)}</h1>
        <p class="lead">${esc(s.summary)}</p>
        <p>${esc(s.description)}</p>
        <dl class="facts">
          <dt>Meets</dt>   <dd>Every ${esc(s.day)} at ${esc(s.time)}</dd>
          <dt>Campus</dt>  <dd>${esc(s.campus)}</dd>
          <dt>Where</dt>   <dd>${esc(s.location)}</dd>
          <dt>Contact</dt> <dd><a href="mailto:${esc(s.contact)}">${esc(s.contact)}</a> <small>(demo address)</small></dd>
        </dl>
        ${tags ? `<h2 class="sr-only">Tags</h2><ul class="tags">${tags}</ul>` : ""}
      </div>

      <section class="block" aria-labelledby="detail-events-heading">
        <h2 id="detail-events-heading" class="block-title">Upcoming events</h2>
        ${upcoming.length
          ? `<ul class="event-list" role="list">${upcoming.map((e) => eventItem(e, { showHost: false })).join("")}</ul>`
          : `<p class="notice">No upcoming events listed yet. Just turn up to a regular ${esc(s.day)} session!</p>`}
      </section>

      ${relatedCourses.length ? `
      <section class="block" aria-labelledby="detail-courses-heading">
        <h2 id="detail-courses-heading" class="block-title">Related courses</h2>
        <ul class="related" role="list">
          ${relatedCourses.map((c) => `<li><a href="${courseUrl(c.id)}">${esc(c.title)} ${esc(c.award)}</a></li>`).join("")}
        </ul>
      </section>` : ""}`;
    document.title = `${s.name} – ${SITE_NAME}`;
  }

  // ---------- Courses ----------
  function populateSubjects() {
    const select = $("#course-subject");
    const subjects = [...new Set(courses.map((c) => c.subject))].sort();
    select.insertAdjacentHTML("beforeend",
      subjects.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join(""));
  }

  function renderCourses({ announceNow = false } = {}) {
    const fd = new FormData(courseForm);
    const q = String(fd.get("q") || "").trim().toLowerCase();
    const subject = String(fd.get("subject") || "");
    const list = courses.filter((c) =>
      (!subject || c.subject === subject) &&
      matchesText([c.title, c.award, c.subject, c.summary, ...c.learn, ...c.skills, ...c.careers], q));

    courseList.innerHTML = list.map((c) => `
      <li>
        <article class="card">
          <div class="badge-row"><span class="badge badge-purple">${esc(c.award)}</span></div>
          <h3><a href="${courseUrl(c.id)}" data-course-id="${esc(c.id)}">${esc(c.title)}</a></h3>
          <p class="card-summary">${esc(c.summary)}</p>
          <p class="card-jobs"><strong>Jobs:</strong> ${esc(c.careers.slice(0, 3).join(", "))}…</p>
          <ul class="meta" aria-label="Subject area"><li>${esc(c.subject)}</li></ul>
        </article>
      </li>`).join("");
    $("#no-courses").hidden = list.length > 0;
    announce(courseCount, (q || subject)
      ? `${plural(list.length, "course", "courses")} found`
      : `Showing ${plural(list.length, "course", "courses")}`, announceNow);
  }

  function renderCourseDetail(id) {
    const c = courseById.get(id);
    const el = views.course;
    if (!c) {
      el.innerHTML = notFound("course", "#/courses", "Browse all courses");
      document.title = `Not found – ${SITE_NAME}`;
      return;
    }
    const li = (arr) => arr.map((x) => `<li>${esc(x)}</li>`).join("");
    const related = (c.relatedSocieties || []).map((id) => societyById.get(id)).filter(Boolean);

    el.innerHTML = `
      <a class="back-link" href="#/courses"><span aria-hidden="true">←</span> All courses</a>
      <div class="detail-card">
        <div class="badge-row"><span class="badge badge-purple">${esc(c.award)}</span><span class="badge">${esc(c.subject)}</span></div>
        <h1 id="course-name" tabindex="-1">${esc(c.title)}</h1>
        <p class="lead">${esc(c.summary)}</p>
        <dl class="facts">
          <dt>Degree</dt><dd>${esc(c.award)} ${esc(c.title)}${AWARD_NAMES[c.award] ? ` (${esc(AWARD_NAMES[c.award])})` : ""}</dd>
          <dt>Subject</dt><dd>${esc(c.subject)}</dd>
        </dl>
        <p>${extLink(c.subjectUrl, `See official ${esc(c.subject)} courses on the LBU website`)}</p>
      </div>

      <div class="info-grid">
        <section class="info-box" aria-labelledby="learn-h">
          <h2 id="learn-h"><span aria-hidden="true">📚</span> What you'll learn</h2>
          <ul>${li(c.learn)}</ul>
        </section>
        <section class="info-box" aria-labelledby="skills-h">
          <h2 id="skills-h"><span aria-hidden="true">💪</span> Skills you'll build</h2>
          <ul>${li(c.skills)}</ul>
        </section>
        <section class="info-box info-box-dark" aria-labelledby="jobs-h">
          <h2 id="jobs-h"><span aria-hidden="true">💼</span> Jobs it can lead to</h2>
          <ul>${li(c.careers)}</ul>
        </section>
        <section class="info-box" aria-labelledby="next-h">
          <h2 id="next-h"><span aria-hidden="true">🚀</span> Next step</h2>
          <p>Want help getting into these jobs? Beckett Careers can check your CV and cover letter and help you find placements.</p>
          <a class="btn btn-primary" href="#/careers">Get careers help</a>
        </section>
      </div>

      ${related.length ? `
      <section class="block" aria-labelledby="course-soc-h">
        <h2 id="course-soc-h" class="block-title">Societies you might like</h2>
        <ul class="related" role="list">
          ${related.map((s) => `<li><a href="${societyUrl(s.id)}">${esc(s.name)}</a></li>`).join("")}
        </ul>
      </section>` : ""}

      <p class="fine-print">Topics and jobs are typical examples for this subject, not official module lists or guaranteed outcomes.
        Check the official LBU course page for current modules, entry requirements and fees.</p>`;
    document.title = `${c.title} ${c.award} – ${SITE_NAME}`;
  }

  function notFound(kind, href, label) {
    const headingId = kind === "course" ? "course-name" : "detail-name";
    return `
      <a class="back-link" href="${href}"><span aria-hidden="true">←</span> Back</a>
      <div class="detail-card">
        <h1 id="${headingId}" tabindex="-1">Hmm, we can't find that ${kind}</h1>
        <p>It may have been renamed or removed.</p>
        <a class="btn btn-primary" href="${href}">${label}</a>
      </div>`;
  }

  // ---------- Routing ----------
  function parseRoute() {
    const h = location.hash;
    let m;
    if (h === "" || h === "#" || h === "#/") return { view: "home" };
    if ((m = h.match(/^#\/societies(?:\/([^/]+))?$/))) return { view: "societies", interest: m[1] ? decodeURIComponent(m[1]) : null };
    if ((m = h.match(/^#\/society\/(.+)$/))) return { view: "society", id: decodeURIComponent(m[1]) };
    if (h === "#/courses") return { view: "courses" };
    if ((m = h.match(/^#\/course\/(.+)$/))) return { view: "course", id: decodeURIComponent(m[1]) };
    if (h === "#/careers") return { view: "careers" };
    return null; // e.g. "#main" from the skip link – not a route
  }

  function showView(name) {
    for (const [key, el] of Object.entries(views)) el.hidden = key !== name;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.dataset.nav === navSection[name]) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function route({ initial = false } = {}) {
    const r = parseRoute();
    if (!r) return;
    const previous = currentView;
    currentView = r.view;

    if (r.view === "society") {
      lastSocietyId = r.id;
      renderSocietyDetail(r.id);
    } else if (r.view === "course") {
      lastCourseId = r.id;
      renderCourseDetail(r.id);
    } else {
      document.title = viewTitles[r.view];
    }
    if (r.view === "societies" && r.interest !== null) {
      setInterest(r.interest);
      renderSocieties();
    }

    showView(r.view);
    if (initial) return;

    // Focus management: returning from a detail page → back to the card you opened
    let target = null;
    if (r.view === "societies" && previous === "society" && lastSocietyId) {
      target = societyList.querySelector(`a[data-society-id="${CSS.escape(lastSocietyId)}"]`);
    } else if (r.view === "courses" && previous === "course" && lastCourseId) {
      target = courseList.querySelector(`a[data-course-id="${CSS.escape(lastCourseId)}"]`);
    }
    if (target) {
      target.focus();
    } else {
      window.scrollTo(0, 0);
      const heading = r.view === "society" ? $("#detail-name")
                    : r.view === "course"  ? $("#course-name")
                    : $(viewHeadings[r.view]);
      heading?.focus({ preventScroll: true });
    }
  }

  // ---------- Event listeners ----------
  form.addEventListener("input", () => renderSocieties());
  form.addEventListener("change", () => renderSocieties());
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(() => { renderSocieties(); $("#search").focus(); }, 0));

  courseForm.addEventListener("input", () => renderCourses());
  courseForm.addEventListener("change", () => renderCourses());
  courseForm.addEventListener("submit", (e) => e.preventDefault());

  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-action="clear"]')) form.reset();
  });

  $(".skip-link").addEventListener("click", (e) => {
    e.preventDefault();
    $("#main").focus();
  });

  window.addEventListener("hashchange", () => route());

  // ---------- Init ----------
  async function init() {
    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      societies = (data.societies || []).slice().sort((a, b) => a.name.localeCompare(b.name));
      events = data.events || [];
      courses = (data.courses || []).slice().sort((a, b) => a.title.localeCompare(b.title));
      societyById = new Map(societies.map((s) => [s.id, s]));
      courseById = new Map(courses.map((c) => [c.id, c]));

      populateSubjects();
      renderHome();
      renderSocieties({ announceNow: true });
      renderCourses({ announceNow: true });
      route({ initial: true });
    } catch (err) {
      console.error("Failed to load data:", err);
      $("#load-error").hidden = false;
      // Careers page is static, so it still works without data
      if (parseRoute()?.view === "careers") showView("careers");
    }
  }

  init();
})();
