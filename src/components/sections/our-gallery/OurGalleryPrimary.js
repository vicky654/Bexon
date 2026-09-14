"use client";
import PopupVideo from "@/components/shared/popup-video/PopupVideo";
import makeWowDelay from "@/libs/makeWowDelay";
import Image from "next/image";
import Link from "next/link";
const OurGalleryPrimary = () => {
	const galleryItems = [
		{
			id: 1,
			className: "col-lg-8",
			image: "/images/gallery/gallery-img-1.webp",
			width: 2560,
			height: 1507,
		},
		{
			id: 2,
			className: "col-lg-4 col-md-6",
			image: "/images/gallery/gallery-img-2.webp",
			width: 1260,
			height: 1536,
		},
		{
			id: 3,
			className: "col-lg-4 col-md-6",
			image: "/images/gallery/gallery-img-3.webp",
			width: 1260,
			height: 1536,
		},
		{
			id: 4,
			className: "col-lg-4 col-md-6",
			image: "/images/gallery/gallery-img-4.webp",
			width: 1260,
			height: 1536,
		},
		{
			id: 5,
			className: "col-lg-4 col-md-6",
			image: "/images/gallery/gallery-img-5.webp",
			width: 1260,
			height: 1536,
		},
		{
			id: 6,
			className: "col-md-4",
			image: "/images/gallery/gallery-img-6.webp",
			width: 1260,
			height: 1536,
		},
		{
			id: 7,
			className: "col-md-8",
			image: "/images/gallery/gallery-img-7.webp",
			width: 2560,
			height: 1507,
		},
	];
	return (
		<section className="tj-gallery-section section-gap">
			<div className="container">
				<div className="row">
					<div className="col-12">
						<div className="sec-heading-wrap">
							<span className="sub-title wow fadeInUp" data-wow-delay="0.1s">
								<i className="tji-box"></i>Our Gallery
							</span>
							<div className="heading-wrap-content">
								<div className="sec-heading">
									<h2 className="sec-title text-anim">
										See our latest company <span>galleries.</span>
									</h2>
								</div>
								<p className="desc wow fadeInUp" data-wow-delay="0.3s">
									Our mission is to empowers businesses off our all size thrives
									an businesses changing marketplaces. In today dynamics
									business environment.
								</p>
							</div>
						</div>
					</div>
				</div>
				<div className="row tj-gallery-wrap">
					{galleryItems?.length
						? galleryItems?.map(
								(
									{
										id,
										image = "/images/project/project-gallery-2.webp",
										className,
										width,
										height,
									},
									idx,
								) => (
									<div className={className} key={idx}>
										<div
											className="image-box wow fadeInUp"
											data-wow-delay={makeWowDelay(idx, 0.3)}
										>
											<PopupVideo>
												<Link
													className="gallery glightbox"
													href={image}
													prefetch={false}
												>
													<Image
														src={image}
														alt="Image"
														width={width}
														height={height}
														style={{ height: "auto" }}
													/>
												</Link>
											</PopupVideo>
										</div>
									</div>
								),
							)
						: ""}
				</div>
			</div>
		</section>
	);
};

export default OurGalleryPrimary;
