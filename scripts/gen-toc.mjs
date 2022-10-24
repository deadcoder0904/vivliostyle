/**
 * node imports
 */
import fs from 'fs'
import path from 'path'

/**
 * unified imports
 */
import { unified } from 'unified'
import { visit } from 'unist-util-visit'

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

const readMarkdownFiles = async (mdFilePaths, entryContext) => {
  return await mdFilePaths
    .map(async (md) => {
      const content = await fs.promises.readFile(
        path.join(entryContext, md),
        'utf8'
      )
      console.log({ content })
      return content
    })
    .join('')
}

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

  const markup = await readMarkdownFiles(mdFilePaths, entryContext)

  console.log({ markup })

  const tree = unified().use(remarkParse).parse(markup)

  visit(tree, (node) => {
    if (node.type === 'heading') {
      console.log(node.children)
    }
  })
}

main()
