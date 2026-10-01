import sliceText from "@/libs/sliceText";
import Link from "next/link";
import JsonLd from "@/components/shared/others/JsonLd";
import { breadcrumbList } from "@/libs/structuredData";
import React from "react";

// Inner-page banner in the home hero's style: dark brand panel with drifting
// glows and a faint grid, the page title, an optional intro line, and a
// breadcrumb pill. Detail pages (blog posts, news, events, resources) pass
// titleAs="p" so the item's own title below is the page's single <h1>.
const HeroInner = ({ title, text, intro, breadcrums = [], titleAs: TitleTag = "h1" }) => {
	return (
		<section className="tj-page-header page-inner-hero">
			<JsonLd data={breadcrumbList(breadcrums, text)} />
			<div className="page-home-hero-bg" aria-hidden="true">
				<span className="page-home-hero-glow glow-1"></span>
				<span className="page-home-hero-glow glow-2"></span>
				<span className="page-home-hero-grid"></span>
			</div>
			<div className="container">
				<div className="row justify-content-center">
					<div className="col-lg-10">
						<div className="tj-page-header-content text-center">
							<nav className="tj-page-link page-inner-hero-crumbs wow fadeInUp" data-wow-delay=".1s" aria-label="Breadcrumb">
								<span>
									<i className="tji-home"></i>
								</span>
								<span>
									<Link href="/">Home</Link>
								</span>
								<span>
									<i className="tji-arrow-right"></i>
								</span>
								{breadcrums?.length
									? breadcrums.map(({ name, path }, idx) => (
											<React.Fragment key={idx}>
												<span>
													<Link href={path ? path : "/"}>{name}</Link>
												</span>
												<span>
													<i className="tji-arrow-right"></i>
												</span>
											</React.Fragment>
									  ))
									: ""}
								<span aria-current="page">{sliceText(text, 28, true)}</span>
							</nav>
							<TitleTag className="tj-page-title page-inner-hero-title title-anim">{title}</TitleTag>
							{intro ? (
								<p className="page-inner-hero-intro wow fadeInUp" data-wow-delay=".4s">
									{intro}
								</p>
							) : null}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};

export default HeroInner;
