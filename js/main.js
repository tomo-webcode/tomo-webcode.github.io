// シーンを切り替える（effect が "turn" のときは振り向く演出つき）
let isTransitioning = false; // 演出中の連打を防ぐ

function changeScene(sceneId, effect) {
  const current = document.querySelector(".scene-container.active");
  const next = document.getElementById(sceneId);
  if (!next || next === current || isTransitioning) return;

  // 「動きを減らす」設定のPCでは演出なしで切り替える
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (effect === "turn" && current && !reduceMotion) {
    isTransitioning = true;
    current.classList.add("turn-out");
    next.classList.add("turn-in");
    next.addEventListener(
      "animationend",
      () => {
        current.classList.remove("active", "turn-out");
        next.classList.remove("turn-in");
        next.classList.add("active");
        isTransitioning = false;
      },
      { once: true }
    );
    return;
  }

  // 演出なし（今までと同じ切り替え）
  document.querySelectorAll(".scene-container").forEach((scene) => {
    scene.classList.remove("active");
  });
  next.classList.add("active");
}

// 合言葉のチェック
function checkPassword() {
  const password = prompt("秘密の部屋の鍵（合言葉）を入力してください：");
  if (password === "干し芋") {
    alert("カチャッ…（この先の内面の部屋は、これから作ります！）");
  } else if (password !== null && password !== "") {
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
