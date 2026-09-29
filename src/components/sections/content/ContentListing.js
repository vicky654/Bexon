import Link from "next/link";

// cards: [{ key, node }] already rendered; buildHref(page) -> string
const ContentListing = ({ cards, total, page, pageSize, buildHref, emptyText, filters }) => {
	const pages = Math.max(1, Math.ceil(total / pageSize));
	return (
		<section className="tj-content-listing section-gap">
			<div className="container">
				{filters ? <div className="content-filters">{filters}</div> : null}
				{cards.length ? (
					<div className="row row-gap-4">
						{cards.map(card => (
							<div className="col-lg-4 col-md-6" key={card.key}>
								{card.node}
							</div>
						))}
					</div>
				) : (
					<div className="content-empty">
						<p>{emptyText}</p>
					</div>
				)}
				{pages > 1 ? (
					<nav className="content-pagination" aria-label="Pagination">
						{Array.from({ length: pages }, (_, i) => i + 1).map(n => (
							<Link key={n} href={buildHref(n)} className={n === page ? "active" : ""} aria-current={n === page ? "page" : undefined}>
								{n}
							</Link>
						))}
					</nav>
				) : null}
			</div>
		</section>
	);
};

export default ContentListing;
