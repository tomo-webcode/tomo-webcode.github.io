let isTransitioning = false; // 演出中の連打を防ぐ

// 白いフェードを最初から再生する
function playFlash() {
  const overlay = document.getElementById("flash-overlay");
  overlay.classList.remove("flash");
  void overlay.offsetWidth; // 再生をやり直すためのおまじない
  overlay.classList.add("flash");
  overlay.addEventListener(
    "animationend",
    () => overlay.classList.remove("flash"),
    { once: true }
  );
}

// シーンを切り替える
// effect: "turn"（振り向く）/ "approach"（近づく）/ "retreat"（下がる）/ 省略（すぐ切り替え）
function changeScene(sceneId, effect) {
  const current = document.querySelector(".scene-container.active");
  const next = document.getElementById(sceneId);
  if (!next || next === current || isTransitioning) return;

  // 「動きを減らす」設定のPCでは演出なしで切り替える
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (effect && current && !reduceMotion) {
    isTransitioning = true;
    current.classList.add(`${effect}-from`);
    next.classList.add(`${effect}-to`);
    if (effect === "turn") playFlash();

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      next.removeEventListener("animationend", onEnd);
      current.classList.remove("active", `${effect}-from`);
      next.classList.remove(`${effect}-to`);
      next.classList.add("active");
      isTransitioning = false;
    };
    // 中の要素のアニメーション終了も届くので、次の場面本体のものだけ見る
    const onEnd = (e) => {
      if (e.target === next) finish();
    };
    next.addEventListener("animationend", onEnd);
    setTimeout(finish, 2000); // 念のための保険
    return;
  }

  // 演出なし
  document.querySelectorAll(".scene-container").forEach((scene) => {
    scene.classList.remove("active");
  });
  next.classList.add("active");
}

// 合言葉のチェック（正解なら本の画面へ）
function checkPassword() {
  const input = prompt("秘密の本を開く合言葉を入力してください：");
  if (input === null || input === "") return;

  // 全角・半角や、大文字・小文字の違いは気にしない（スマホで打ちやすいように）
  const normalized = input.normalize("NFKC").trim().toUpperCase();
  if (normalized === "KZ") {
    changeScene("scene-5", "approach");
  } else {
    alert("合言葉が違います。本は静かに閉じられたままです。");
  }
}

// data-scene を持つボタンを押したら、そのシーンへ移動
document.querySelectorAll("[data-scene]").forEach((button) => {
  button.addEventListener("click", () =>
    changeScene(button.dataset.scene, button.dataset.effect)
  );
});

// 本のボタン
document.getElementById("book-btn").addEventListener("click", checkPassword);

// 画像の縦横比をステージに伝える（クリック範囲のずれ防止）
document.querySelectorAll(".scene-image").forEach((img) => {
  const applyRatio = () => {
    if (img.naturalWidth && img.naturalHeight) {
      img.parentElement.style.setProperty(
        "--ratio",
        img.naturalWidth / img.naturalHeight
      );
    }
  };
  if (img.complete) {
    applyRatio();
  } else {
    img.addEventListener("load", applyRatio);
  }
});
