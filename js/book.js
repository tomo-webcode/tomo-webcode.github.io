// 古い羊皮紙の本：ページを作る・めくる・「読んだ」チェックを覚える
(function () {
  const STORAGE_KEY = "kz-reading-checks"; // チェックはこのスマホ／パソコンのブラウザに保存されます
  const ROWS_PER_PAGE = 6; // 1ページに載せる本の数
  const FLIP_MS = 900; // めくる時間（CSSの --flip-duration と同じ長さに）

  const wrap = document.getElementById("book-wrap");
  const book = document.getElementById("book");
  const prevBtn = document.getElementById("book-prev");
  const nextBtn = document.getElementById("book-next");
  const pageInfo = document.getElementById("book-page-info");
  if (!wrap || !book || typeof KZ_BOOKS === "undefined") return;

  // 画面が狭い・縦長のときは「1ページずつ」、広いときは「見開き」
  const singleQuery = window.matchMedia("(max-width: 700px), (max-aspect-ratio: 11/10)");

  let mode = null; // "spread"（見開き）or "single"（1ページ）
  let state = 0; // めくり終わった葉（紙）の数
  let leaves = [];
  let totalPages = 0;
  let zTimer = null;

  /* ---------- チェックの保存 ---------- */
  function loadChecks() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch (e) {
      return new Set();
    }
  }
  function saveChecks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(checks)));
    } catch (e) {
      /* 保存できない環境では、このページを開いている間だけ有効 */
    }
  }
  const checks = loadChecks();
  const keyOf = (b) => b.no + "|" + b.title;

  /* ---------- ページの中身 ---------- */
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeTitlePage() {
    const page = el("div", "page title-page");
    const frame = el("div", "title-frame");
    frame.appendChild(el("p", "title-script", "Reading Record"));
    frame.appendChild(el("div", "flourish"));
    frame.appendChild(
      el("p", "title-script title-story", "A novel Tamami began reading in the autumn of fifth grade")
    );
    page.appendChild(frame);
    return page;
  }

  function makeEntryPage(items, startIndex, pageNo) {
    const page = el("div", "page entry-page");
    page.appendChild(el("h3", "page-head", KZ_SERIES_TITLE));
    const list = el("ul", "entries");
    items.forEach((b, i) => {
      const n = startIndex + i;
      const li = el("li", "entry");
      // 手書きっぽく、1行ずつほんの少しだけ傾ける
      li.style.setProperty("--tilt", ((n * 37) % 13 - 6) / 12 + "deg");
      li.appendChild(el("span", "entry-no", b.no));
      li.appendChild(el("span", "entry-title", b.title));

      const check = el("button", "check");
      check.type = "button";
      check.dataset.key = keyOf(b);
      check.setAttribute("aria-label", b.no + " " + b.title + " を読んだ");
      const on = checks.has(keyOf(b));
      check.classList.toggle("on", on);
      check.setAttribute("aria-pressed", String(on));
      li.appendChild(check);

      list.appendChild(li);
    });
    page.appendChild(list);
    page.appendChild(el("p", "page-no", "– " + pageNo + " –"));
    return page;
  }

  function makeEndPage() {
    const page = el("div", "page end-page");
    page.appendChild(el("p", "title-script", "To be continued…"));
    return page;
  }

  function buildPages() {
    const pages = [makeTitlePage()];
    for (let i = 0, p = 1; i < KZ_BOOKS.length; i += ROWS_PER_PAGE, p++) {
      pages.push(makeEntryPage(KZ_BOOKS.slice(i, i + ROWS_PER_PAGE), i, p));
    }
    if (pages.length % 2 === 1) pages.push(makeEndPage()); // 見開きで余らないように
    return pages;
  }

  function face(side, pageEl) {
    const f = el("div", "face " + side);
    f.appendChild(pageEl);
    return f;
  }

  /* ---------- 本を組み立てる ---------- */
  function build(newMode) {
    mode = newMode;
    wrap.classList.toggle("book-single", mode === "single");
    wrap.classList.toggle("book-spread", mode === "spread");
    book.textContent = "";
    leaves = [];

    const pages = buildPages();
    totalPages = pages.length;

    if (mode === "spread") {
      // 1枚の紙の表＝右ページ、裏＝次の見開きの左ページ
      for (let k = 0; k < pages.length / 2; k++) {
        const leaf = el("div", "leaf");
        leaf.appendChild(face("front", pages[2 * k]));
        leaf.appendChild(face("back", pages[2 * k + 1]));
        book.appendChild(leaf);
        leaves.push(leaf);
      }
      pages.forEach((p, i) => p.classList.add(i % 2 === 0 ? "page-right" : "page-left"));
    } else {
      // 1ページずつ：紙の裏は白紙
      pages.forEach((p) => {
        const leaf = el("div", "leaf");
        p.classList.add("page-right");
        leaf.appendChild(face("front", p));
        const blank = el("div", "page page-blank page-left");
        leaf.appendChild(face("back", blank));
        book.appendChild(leaf);
        leaves.push(leaf);
      });
    }
  }

  const maxState = () => (mode === "spread" ? totalPages / 2 : totalPages - 1);

  // 今見ているページ番号（0 = 表紙）
  function currentPageIndex() {
    if (mode === "spread") return state === 0 ? 0 : 2 * state - 1;
    return state;
  }

  /* ---------- めくる ---------- */
  function settleZ() {
    leaves.forEach((leaf, i) => {
      // めくり終わった紙は後のものほど上、まだの紙は前のものほど上
      leaf.style.zIndex = i < state ? i + 1 : leaves.length - i;
    });
  }

  function render() {
    leaves.forEach((leaf, i) => leaf.classList.toggle("flipped", i < state));
    prevBtn.disabled = state <= 0;
    nextBtn.disabled = state >= maxState();
    if (pageInfo) {
      const shown = currentPageIndex();
      pageInfo.textContent = shown === 0 ? "表紙" : shown + " / " + (totalPages - 1);
    }
  }

  function goTo(next) {
    next = Math.max(0, Math.min(maxState(), next));
    if (next === state) return;
    const prev = state;
    state = next;
    leaves.forEach((leaf, i) => {
      // めくっている最中の紙は、いちばん手前に出す
      if ((i < state) !== (i < prev)) leaf.style.zIndex = 1000;
    });
    render();
    clearTimeout(zTimer);
    zTimer = setTimeout(settleZ, FLIP_MS + 50);
  }

  // 画面の広さが変わったときは、今のページを保ったまま作り直す
  function rebuild(force) {
    const newMode = singleQuery.matches ? "single" : "spread";
    if (!force && newMode === mode) return;
    const idx = mode ? currentPageIndex() : 0;
    build(newMode);
    state = newMode === "spread" ? Math.ceil(idx / 2) : idx;
    wrap.classList.add("no-anim");
    render();
    settleZ();
    void wrap.offsetWidth; // 動きなしで反映させる
    wrap.classList.remove("no-anim");
  }

  /* ---------- 操作 ---------- */
  prevBtn.addEventListener("click", () => goTo(state - 1));
  nextBtn.addEventListener("click", () => goTo(state + 1));

  document.addEventListener("keydown", (e) => {
    if (!document.getElementById("scene-5").classList.contains("active")) return;
    if (e.key === "ArrowRight") goTo(state + 1);
    if (e.key === "ArrowLeft") goTo(state - 1);
  });

  // 指で左右にスワイプ
  let touchX = null;
  wrap.addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  wrap.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) > 50) goTo(dx < 0 ? state + 1 : state - 1);
  }, { passive: true });

  // 「読んだ」チェック
  book.addEventListener("click", (e) => {
    const btn = e.target.closest(".check");
    if (!btn) return;
    const key = btn.dataset.key;
    const on = !checks.has(key);
    if (on) checks.add(key);
    else checks.delete(key);
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-pressed", String(on));
    saveChecks();
  });

  if (singleQuery.addEventListener) singleQuery.addEventListener("change", () => rebuild(false));
  else singleQuery.addListener(() => rebuild(false));

  rebuild(true);
})();
