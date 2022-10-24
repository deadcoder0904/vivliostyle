module.exports = {
  title: 'creating a book using markdown', // populated into `publication.json`, default to `title` of the first entry or `name` in `package.json`.
  author: 'akshay kadam (a2k)', // default to `author` in `package.json` or undefined.
  language: 'en', // default to undefined.
  size: 'A4', // paper size.
  theme: '@vivliostyle/theme-gutenberg', // .css or local dir or npm package. default to undefined.
  entry: [
    {
      rel: 'contents',
      path: 'toc.html',
      theme: 'top.css',
    },
    './chapter1/index.md',
    './chapter2/index.md',
    // {
    //   path: 'epigraph.md',
    //   title: 'Epigraph', // title can be overwritten (entry > file),
    //   theme: '@vivliostyle/theme-whatever', // theme can be set individually. default to the root `theme`.
    // },
    // 'glossary.html', // html can be passed.
  ], // `entry` can be `string` or `object` if there's only single markdown file.
  entryContext: './_book', // default to '.' (relative to `vivliostyle.config.js`).
  output: [
    // path to generate draft file(s). default to '{title}.pdf'
    './output.pdf', // the output format will be inferred from the name.
    {
      path: './book',
      format: 'webpub',
    },
  ],
  // workspaceDir: '.vivliostyle', // directory which is saved intermediate files.
  // toc: 'toc.html', // whether generate and include ToC HTML or not, default to 'false'.
  tocTitle: 'table of contents',
  cover: './cover.png', // cover image. default to undefined.
  // vfm: { // options of VFM processor
  //   hardLineBreaks: true, // converts line breaks of VFM to <br> tags. default to 'false'.
  //   disableFormatHtml: true, // disables HTML formatting. default to 'false'.
  // },
}
