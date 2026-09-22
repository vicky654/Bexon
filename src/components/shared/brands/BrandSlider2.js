"use client";

import useBrands from "@/libs/useBrands";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const BrandSlider2 = ({ type }) => {
	const brands = useBrands();
	return (
		<Swiper
			slidesPerView="auto"
			spaceBetween={0}
			freeMode={true}
			centeredSlides={true}
			loop={true}
			speed={5000}
			allowTouchMove={true}
			autoplay={{
				delay: 1,
				disableOnInteraction: false,
				pauseOnMouseEnter: true,
			}}
			className={`client-slider client-slider-2 ${
				type === 2 ? "h6-client-slider" : ""
			}`}
			modules={[Autoplay]}
		>
			{brands?.length
				? brands?.map(({ img2 = "/images/brands/brand-1-light.webp", alt }, idx) => (
						<SwiperSlide key={idx} className="client-item">
							<div className="client-logo">
								<img src={img2} alt={alt || "Client logo"} />
							</div>
						</SwiperSlide>
				  ))
				: ""}
		</Swiper>
	);
};

export default BrandSlider2;
