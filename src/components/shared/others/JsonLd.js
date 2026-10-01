// Renders schema.org data as a JSON-LD script. "<" is escaped so text from the
// CMS can never close the script tag early.
const JsonLd = ({ data }) =>
	data ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} /> : null;

export default JsonLd;
