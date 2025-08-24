async function startGame() {
  document.getElementById("html").innerHTML =
    await (await fetch("game.html")).text();
}
