// シーンを切り替える
function changeScene(sceneId) {
  document.querySelectorAll(".scene-container").forEach((scene) => {
    scene.classList.remove("active");
  });
  document.getElementById(sceneId).classList.add("active");
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
  button.addEventListener("click", () => changeScene(button.dataset.scene));
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
