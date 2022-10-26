/**
 * node imports
 */
import path from 'path'

/**
 * unified imports
 */
import { unified } from 'unified'
import { visit } from 'unist-util-visit'
import { read, write } from 'to-vfile'

/**
 * remark imports
 */
import remarkRehype from 'remark-rehype'
import remarkParse from 'remark-parse'

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
import GithubSlugger from 'github-slugger'

/**
 * local imports
 */
import vivliostyleConfig from '../vivliostyle.config.js'

const readMarkdownFiles = async (mdFilePaths, entryContext) => {
  return await Promise.all(
    mdFilePaths.map(async (mdPath) => {
      const content = await read(path.join(entryContext, mdPath), {
        encoding: 'utf8',
      })
      return { path: mdPath, content: content.value }
    })
  )
}

const main = async () => {
  // read entry from vivliostyle.config.js in order & then change toc.html to contain only toc
  const { title, author, entry, entryContext, toc, tocTitle } =
    vivliostyleConfig
  const slugger = new GithubSlugger()

  let tocCss = ''

  const mdFilePaths = entry.filter((e) => {
    if (typeof e === 'string') {
      return true
    }
    if (e.rel === 'contents') {
      tocCss = e.theme
    }
    return false
  })

  const files = await readMarkdownFiles(mdFilePaths, entryContext)

  const link = [
    {
      rel: 'publication',
      href: 'publication.json',
      type: 'application/ld+json',
    },
    {
      rel: 'preconnect',
      href: 'https://rsms.me/',
    },
    {
      rel: 'stylesheet',
      href: 'https://rsms.me/inter/inter.css',
    },
  ]

  if (tocCss.length !== 0) {
    link.push({
      href: tocCss,
      rel: 'stylesheet',
    })
  }

  let lis = []
  let n = 1

  files.forEach((file) => {
    const tree = unified().use(remarkParse).parse(file.content)

    visit(tree, (node) => {
      if (node.type === 'heading') {
        const noOfHastags = '#'.repeat(node.depth)
        const htmlFilePath = file.path.replace('.md', '.html')
        const href =
          node.depth === 1
            ? htmlFilePath
            : `${htmlFilePath}#${slugger.slug(node.children[0].value)}`
        const value = `${noOfHastags} ${node.children[0].value}`
        lis.push({ href, value })
      }
    })
  })

  const markup = files.map((file) => file.content).join('\n\n')

  const processor = await unified()
    .use(remarkParse, { fragment: true })
    .use(remarkRehype)
    .use(rehypeDocument, {
      title,
      link,
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
          const entries = [title, tocTitle, author]
          if (entries.includes(node.children[0].value)) return
          node.properties.id = slugger.slug(node.children[0].value)
        }

        if (node.type === 'element' && node.tagName === 'body') {
          node.properties = { class: 'prose' }
          node.children = [
            {
              type: 'element',
              tagName: 'h1',
              properties: {
                class: 'frontcover',
              },
              children: [{ type: 'text', value: title }],
            },
            {
              type: 'element',
              tagName: 'h2',
              properties: {
                class: 'text-2xl',
              },
              children: [{ type: 'text', value: `by ${author}` }],
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
                    { type: 'text', value: tocTitle || 'table of contents' },
                  ],
                },
                {
                  type: 'element',
                  tagName: 'ol',
                  properties: {},
                  children: lis.map((li) => {
                    const text = li.value.replaceAll('#', '').trim()
                    const depth = li.value.match(/#/g || []).length

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
          ]
        }
      },
    })
    .use(rehypeFormat)
    .use(rehypeStringify)

  try {
    const file = await processor.process(markup)
    file.path = path.join(entryContext, 'toc')
    file.extname = '.html'
    await write(file)
  } catch (error) {
    throw error
  }
}

main()
