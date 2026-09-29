// Body HTML is authored by admins in the rich-text editor (same trust model as blogs).
const ContentDetail = ({ item, meta, aside }) => (
	<section className="tj-content-detail section-gap">
		<div className="container">
			<div className="row row-gap-5">
				<div className={aside ? "col-lg-7" : "col-lg-10 mx-auto"}>
					{item.coverImage ? <img className="content-detail-cover" src={item.coverImage} alt="" /> : null}
					{meta ? <div className="content-detail-meta">{meta}</div> : null}
					<h2 className="content-detail-title">{item.title}</h2>
					<p className="content-detail-summary">{item.summary}</p>
					<div className="content-detail-body" dangerouslySetInnerHTML={{ __html: item.body || "" }} />
				</div>
				{aside ? <div className="col-lg-5">{aside}</div> : null}
			</div>
		</div>
	</section>
);

export default ContentDetail;
