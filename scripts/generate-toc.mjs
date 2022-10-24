/**
 * node imports
 */
import path from 'path'

/**
 * unified imports
 */
import { unified } from 'unified'
import { readSync, writeSync } from 'to-vfile'

/**
 * remark imports
 */
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import remarkParse from 'remark-parse'
import remarkToc from 'remark-toc'

/**
 * rehype imports
 */
import rehypeDocument from 'rehype-document'
import rehypeStringify from 'rehype-stringify'
import rehypeRewrite from 'rehype-rewrite'
import rehypeFormat from 'rehype-format'

/**
 * npm imports
 */
import slugify from '@sindresorhus/slugify'

/**
 * local imports
 */
import vivliostyleConfig from '../vivliostyle.config.js'

const main = async () => {
  // read entry from vivliostyle.config.js in order & then change toc.html
  const { title, entry, entryContext, toc, tocTitle } = vivliostyleConfig
  let tocCss = ''

  const mdFilePaths = entry.filter((e) => {
    if (typeof e === 'string') {
      return e
    } else {
      if (e.rel === 'contents') {
        tocCss = e.theme
      }
    }
  })

  let markup = ''

  mdFilePaths.forEach((md) => {
    const content = readSync(path.join(entryContext, md))
    markup += content
  })

  writeSync({
    path: 'temp.md',
    value: markup,
  })

  const link = [
    {
      rel: 'publication',
      href: 'publication.json',
      type: 'application/ld+json',
    },
  ]

  if (tocCss.length !== 0) {
    link.push({
      href: tocCss,
      rel: 'stylesheet',
    })
  }

  let lis = []

  const processor = await unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype)
    .use(rehypeDocument, {
      title,
      link,
    })
    .use(rehypeRewrite, {
      rewrite: (node, index, parent) => {},
    })
    .use(rehypeRewrite, {
      rewrite: (node, index, parent) => {
        if (
          node.type == 'element' &&
          (node.tagName == 'h1' ||
            node.tagName == 'h2' ||
            node.tagName == 'h3' ||
            node.tagName == 'h4' ||
            node.tagName == 'h5' ||
            node.tagName == 'h6') &&
          !node.properties.id
        ) {
          console.log('headers')
          if (
            node.children[0].value === title ||
            node.children[0].value === tocTitle
          )
            return
          const noOfHastags = '#'.repeat(Number(node.tagName.replace('h', '')))
          const href =
            node.tagName === 'h1'
              ? 'chapter1/index.html'
              : slugify(node.children[0].value)
          const value = `${noOfHastags} ${node.children[0].value}`
          lis.push({ href, value })
          console.log({ lis })
          node.children = [
            {
              ...node.children[0],
              properties: { id: slugify(node.children[0].value) },
              children: [{ type: 'text', value: node.children[0].value }],
            },
          ]
        }

        if (node.type === 'element' && node.tagName === 'body') {
          node.children = [
            {
              type: 'element',
              tagName: 'h1',
              properties: {},
              children: [{ type: 'text', value: title }],
            },
            {
              type: 'element',
              tagName: 'nav',
              properties: {
                id: 'toc',
                role: 'doc-toc',
              },
              children: [
                {
                  type: 'element',
                  tagName: 'h2',
                  properties: {},
                  children: [
                    { type: 'text', value: tocTitle || 'Table of Contents' },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'ol',
                  properties: {},
                  children: lis.map((li) => {
                    const text = li.replaceAll('#', '').trim()
                    const depth = li.match(/#/g || []).length

                    let properties = {
                      href: li.href,
                      class: '',
                    }

                    if (depth > 1) {
                      properties = {
                        href: li.href,
                        class: `ml-${(depth - 1) * 3}`,
                      }
                    }

                    return {
                      type: 'element',
                      tagName: 'li',
                      properties: {},
                      children: [
                        {
                          type: 'element',
                          tagName: 'a',
                          properties,
                          children: [
                            {
                              type: 'text',
                              value: text,
                            },
                          ],
                        },
                      ],
                    }
                  }),
                },
              ],
            },
            ...node.children,
          ]
        }
      },
    })
    .use(rehypeFormat)
    .use(rehypeStringify)

  try {
    const tocContent = await remark()
      // .use(remarkParse, { fragment: true })
      // .use(remarkRehype)
      // .use(rehypeStringify)
      .use(remarkToc)
      .process(await readSync('temp.md'))

    writeSync(tocContent)
    const file = await processor.process(markup)
    file.path = path.join(entryContext, 'toc')
    file.extname = '.html'
    writeSync(file)
  } catch (error) {
    throw error
  }

  console.log({
    vivliostyleConfig,
    entry,
    entryContext,
    toc,
    tocTitle,
    mdFilePaths,
  })
}

main()
