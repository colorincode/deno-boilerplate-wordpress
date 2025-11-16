import process from "node:process";

export function startDinoAnimation() {
  const dinoRight = [
    "               __ ",
    "              / _)",
    "     _.----._/ /  ",
    "    /         /   ",
    " __/ (  | (  |    ",
    "/__.-'|_|--|_|    ",
  ];

  const dinoLeft = [
    " __",
    "(_ \\",
    "  \\ \\_.----._",
    "   \\         \\",
    "    |  ) |  ) \\__",
    "    |_|--|_|'-.__\\",
  ];

  const dinoEatingFruit = [
    "               __ ",
    "              / _0",
    "     _.----._/ /  ",
    "    /         /   ",
    " __/ (  | (  |    ",
    "/__.-'|_|--|_|    ",
  ];

  const tree = [
    "            # # # ## ##",
    "         # # # ## ## #### ##",
    "       #  ## # ## ### ####### ##",
    "      # ##  ## ### # ### ## # ## #",
    "       ##    ###   ###  _.-## ## #",
    " # #      \\\\ #0  \\#  # /  _.- # 0",
    "#0\\_.-.__  ##  #// ##   /   0",
    " / .-  _.-._ # // # _.-'",
    "0 0        \\. _  /",
    "             | -  /",
    "             _  - |",
    "            / .   |",
    "           / /  ;  \\",
  ];

  const treeEaten = [
    "            # # # ## ##",
    "         # # # ## ## #### ##",
    "       #  ## # ## ### ####### ##",
    "      # ##  ## ### # ### ## # ## #",
    "       ##    ###   ###  _.-## ## #",
    " # #      \\\\ #0  \\#  # /  _.- # 0",
    "#0\\_.-.__  ##  #// ##   /   0",
    " / .-  _.-._ # // # _.-'",
    "  0        \\. _  /",
    "             | -  /",
    "             _  - |",
    "            / .   |",
    "           / /  ;  \\",
  ];

  let offset = 0;
  let isRunning = true;
  let isEating = false;
  let isPausing = false;
  let treeSpaces = 40;
  let frozenTreeSpaces: number | null = null;
  let hasEaten = false;

  const moveUp = (n: number) => `\x1B[${n}A`;
  const clearLine = () => `\x1B[2K`;
  const moveToStart = () => `\x1B[0G`;
  const dinoGreen = `\x1B[32m`;
  const treeGreen = `\x1B[32;2m`;
  const red = `\x1B[31m`;
  const reset = `\x1B[0m`;

  const colorZerosRed = (str: string) => str.replace(/0/g, `${red}0${reset}`);

  const colorHashesTreeGreen = (str: string) => str.replace(/#/g, `${treeGreen}#${reset}`);

  function getTreeSpacing(lineIndex: number, isEating: boolean, isPausing: boolean, treeSpaces: number): number {
    const spaces = frozenTreeSpaces ?? treeSpaces;
    const extraSpaces = lineIndex < (tree.length - dinoRight.length) ? 18 : 0;
    return spaces + extraSpaces;
  }

  function printDino() {
    process.stdout.write("\n");
    const dino = isEating ? dinoEatingFruit : dinoRight;
    const currentTree = hasEaten ? treeEaten : tree;
    for (let i = 0; i < tree.length; i++) {
      const dinoIndex = i - (tree.length - dino.length);
      const dinoLine = dinoIndex >= 0 && dinoIndex < dino.length ? colorZerosRed(dino[dinoIndex]) : "";
      const treeLine = colorHashesTreeGreen(colorZerosRed(currentTree[i] || ""));
      const spacing = getTreeSpacing(i, isEating, isPausing, treeSpaces);
      process.stdout.write(
        `${clearLine()}${moveToStart()}${" ".repeat(offset)}${dinoGreen}${dinoLine}${reset}${" ".repeat(spacing)}${treeLine}\n`
      );
    }
  }

  process.stdout.write("\n\n\n");
  printDino();

  const interval = setInterval(() => {
    if (!isRunning) return;
    process.stdout.write(moveUp(14));
    printDino();
    process.stdout.write(`${clearLine()}${moveToStart()}`);
    if (!isEating && !isPausing) {
      offset++;
      treeSpaces = Math.max(0, treeSpaces - 1);
    }
  }, 100);

  setTimeout(() => {
    frozenTreeSpaces = treeSpaces;
    isEating = true;
    hasEaten = true;
  }, 4000);
  setTimeout(() => {
    isEating = false;
    isPausing = true;
  }, 5000);
  setTimeout(() => {
    stopAnimation();
  }, 7000);

  function stopAnimation() {
    if (!isRunning) return;
    isRunning = false;
    clearInterval(interval);
    process.stdout.write(moveUp(14));
    process.stdout.write("\n");
    const dino = dinoRight;
    const currentTree = hasEaten ? treeEaten : tree;
    for (let i = 0; i < tree.length; i++) {
      const dinoIndex = i - (tree.length - dino.length);
      const dinoLine = dinoIndex >= 0 && dinoIndex < dino.length ? colorZerosRed(dino[dinoIndex]) : "";
      const treeLine = colorHashesTreeGreen(colorZerosRed(currentTree[i] || ""));
      const spacing = getTreeSpacing(i, isEating, isPausing, treeSpaces);
      process.stdout.write(
        `${clearLine()}${moveToStart()}${" ".repeat(offset)}${dinoGreen}${dinoLine}${reset}${" ".repeat(spacing)}${treeLine}\n`
      );
    }
  }

  return { stopAnimation };
}