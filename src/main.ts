import axios from "axios";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const MAX_PAGE = 273;
// const MAX_PAGE = 3;
const URI =
  "http://ebook.tsherpa.co.kr/webdata/15/15ebook_H/EB2015TC3MM_01_10L_CD/resource/ebook/ebook.epub/ops/js/render-page-{0}.js";
const IMAGE_BASE_URI =
  "http://ebook.tsherpa.co.kr/webdata/15/15ebook_H/EB2015TC3MM_01_10L_CD/resource/ebook/ebook.epub/ops/{0}";

const download = async () => {
  const tasks: Promise<void>[] = [];
  for (let i = 1; i <= MAX_PAGE; i++) {
    const task = (async () => {
      const currentUri = URI.replace("{0}", String(i));
      const res = await axios.get(currentUri);
      const data = res.data as string;
      const img = data.match(/path":"(images\/master\/.*?)"/);

      if (img) {
        const imgBinary = await axios.get(
          IMAGE_BASE_URI.replace("{0}", img[1]),
          { responseType: "stream" }
        );
        const writer = fs.createWriteStream(
          path.resolve(
            __dirname,
            "../images",
            `${String(i).padStart(3, "0")}.jpg`
          )
        );

        imgBinary.data.pipe(writer);
        writer.on("error", (err) => console.error(err));
      }
    })();
    tasks.push(task);
  }
  await Promise.all(tasks);
};

const makePDF = () => {
  const doc = new PDFDocument({ autoFirstPage: false });
  const writer = fs.createWriteStream(path.resolve(__dirname, "../pdf.pdf"));
  doc.pipe(writer);

  for (let i = 1; i <= MAX_PAGE; i++) {
    doc
      .addPage({ margin: 0, size: [1232, 1586] })
      .image(`./images/${String(i).padStart(3, "0")}.jpg`);
  }

  doc.end();
};

makePDF();
