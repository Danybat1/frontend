// utility function defintion 

const textToImage = ({ text }) => {
    const canvas = document.createElement("canvas");

    canvas.width = 593;
    canvas.height = 192;

    const ctx = canvas.getContext("2d");

    ctx.font = "60px Mr Dafoe";

    ctx.fillText(
      text,
      30 + (29.65 * (20 - text?.length)) / 2,
      100,
      593
    );

    return  canvas.toDataURL();
}

export default textToImage