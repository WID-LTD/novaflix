const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { DocumentSigner } = require('../signature-generator/signature-generator');

class DocumentationBuilder {
  constructor() {
    this.signer = new DocumentSigner();
    this.docsRoot = path.join(__dirname, '../../novaflix');
    this.outputDir = path.join(__dirname, '../../../dist/docs');
    this.stats = { processed: 0, signed: 0, watermarked: 0, errors: [] };
  }

  async build() {
    console.log('\uD83D\uDCDA Building NovaFlix Documentation Suite...\n');

    const mdFiles = await this.discoverMarkdownFiles(this.docsRoot);
    console.log(`Found ${mdFiles.length} markdown files`);

    await fs.ensureDir(this.outputDir);

    for (const file of mdFiles) {
      try {
        await this.processFile(file);
        this.stats.processed++;
      } catch (err) {
        this.stats.errors.push({ file, error: err.message });
        console.error(`\u274C Error processing ${file}:`, err.message);
      }
    }

    await this.generateMasterIndex(mdFiles);
    this.printSummary();
  }

  async discoverMarkdownFiles(dir) {
    const files = [];
    async function walk(currentDir) {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await walk(fullPath);
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('.')) {
          files.push(fullPath);
        }
      }
    }
    await walk(dir);
    return files.sort();
  }

  async processFile(filePath) {
    const relativePath = path.relative(this.docsRoot, filePath);
    const outputPath = path.join(this.outputDir, relativePath.replace('.md', '.pdf'));

    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontmatter, content: mdContent } = matter(content);

    const html = this.markdownToHtml(mdContent, frontmatter);
    const pdfBytes = await this.htmlToPdf(html, frontmatter);

    const signedPdf = await this.signer.applyToPDF(pdfBytes, relativePath);

    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, signedPdf);

    this.stats.signed++;
    this.stats.watermarked++;
    console.log(`\u2705 ${relativePath} \u2192 ${path.relative(this.outputDir, outputPath)}`);
  }

  markdownToHtml(mdContent, frontmatter) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${frontmatter.title || 'NovaFlix Document'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Great+Vibes&family=JetBrains+Mono&display=swap');
    body { font-family: 'Inter', sans-serif; line-height: 1.7; color: #131313; max-width: 800px; margin: 0 auto; padding: 40px; }
    h1,h2,h3,h4 { font-weight: 700; color: #050505; }
    h1 { font-size: 2.5rem; border-bottom: 3px solid #E50914; padding-bottom: 0.5rem; }
    h2 { font-size: 1.8rem; margin-top: 2.5rem; color: #E50914; }
    h3 { font-size: 1.4rem; }
    code { font-family: 'JetBrains Mono', monospace; background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 4px; }
    pre { background: #050505; color: #E5E2E1; padding: 1.5rem; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; color: inherit; }
    .frontmatter { background: #FFF5F5; border: 1px solid #E50914; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.9rem; }
    .frontmatter h4 { margin: 0 0 0.5rem; color: #E50914; }
    table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.75rem; text-align: left; }
    th { background: #E50914; color: white; }
    tr:nth-child(even) { background: #fafafa; }
    .signature-block { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #ddd; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  ${frontmatter ? `<div class="frontmatter"><h4>Document Metadata</h4><pre>${JSON.stringify(frontmatter, null, 2)}</pre></div>` : ''}
  ${this.simpleMarkdownToHtml(mdContent)}
</body>
</html>`;
  }

  simpleMarkdownToHtml(md) {
    return md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/^(.*$)/gim, '<p>$1</p>')
      .replace(/<p><\/p>/gim, '');
  }

  async htmlToPdf(html, frontmatter) {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '30mm', left: '20mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size:8px; width:100%; text-align:center; color:#999;">NovaFlix \u2022 WID Ltd (RC 8824091) \u2022 Confidential</div>',
      footerTemplate: '<div style="font-size:8px; width:100%; text-align:center; color:#999;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
    });
    await browser.close();
    return pdf;
  }

  async generateMasterIndex(mdFiles) {
    const index = {
      generated: new Date().toISOString(),
      totalDocuments: mdFiles.length,
      categories: {},
      documents: []
    };

    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8');
      const { data: fm } = matter(content);
      const relativePath = path.relative(this.docsRoot, file);
      const category = relativePath.split('/')[1] || 'root';

      if (!index.categories[category]) index.categories[category] = 0;
      index.categories[category]++;

      index.documents.push({
        path: relativePath,
        title: fm.title || path.basename(file, '.md'),
        category,
        lastModified: (await fs.stat(file)).mtime.toISOString(),
        docId: this.signer.generateDocId(relativePath)
      });
    }

    await fs.writeFile(
      path.join(this.outputDir, 'MASTER_INDEX.json'),
      JSON.stringify(index, null, 2)
    );
    console.log('\n\uD83D\uDCCB Master index generated: MASTER_INDEX.json');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('\uD83D\uDCCA BUILD SUMMARY');
    console.log('='.repeat(60));
    console.log(`\u2705 Processed:  ${this.stats.processed}`);
    console.log(`\uD83D\uDD8B\uFE0F  Signed:     ${this.stats.signed}`);
    console.log(`\uD83D\uDCA7 Watermarked: ${this.stats.watermarked}`);
    console.log(`\u274C Errors:     ${this.stats.errors.length}`);
    console.log(`\uD83D\uDCC1 Output:     ${this.outputDir}`);
    if (this.stats.errors.length) {
      console.log('\nErrors:');
      this.stats.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
    }
  }
}

if (require.main === module) {
  const builder = new DocumentationBuilder();
  builder.build().catch(console.error);
}

module.exports = { DocumentationBuilder };