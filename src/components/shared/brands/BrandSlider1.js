"use client";

import useBrands from "@/libs/useBrands";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const BrandSlider1 = ({ className }) => {
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
				disableOnInteraction: true,
				pauseOnMouseEnter: true,
			}}
			className={`client-slider ${className ? className : "client-slider-1"}`}
			modules={[Autoplay]}
		>
			{brands?.length
				? brands?.map(({ img, alt }, idx) => (
						<SwiperSlide key={idx} className="client-item">
							<div className="client-logo">
								<img
									src={img ? img : "/images/brands/brand-1.webp"}
									alt={alt || "Client logo"}
								/>
							</div>
						</SwiperSlide>
				  ))
				: ""}
		</Swiper>
	);
};

export default BrandSlider1;
