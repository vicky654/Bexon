"use client";
import { useEffect, useState } from "react";
import CareerCard from "@/components/shared/cards/CareerCard";
import Paginations from "@/components/shared/others/Paginations";
import usePagination from "@/hooks/usePagination";

const Careers1 = () => {
	const [items, setItems] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetch("/api/jobs")
			.then(res => res.json())
			.then(data => setItems(data?.jobs || []))
			.catch(() => setItems([]))
			.finally(() => setIsLoading(false));
	}, []);

	const limit = 6;
	// get pagination details
	const {
		currentItems,
		currentpage,
		setCurrentpage,
		paginationItems,
		currentPaginationItems,
		totalPages,
		handleCurrentPage,
		firstItem,
		lastItem,
	} = usePagination(items, limit);
	const totalPortfolios = items?.length;
	const totalPortfoliosToShow = currentItems?.length;
	return (
		<section className="tj-careers-section section-gap">
			<div className="container">
				<div className="row rg-30">
					{currentItems?.length ? (
						currentItems?.map((careerSingle, idx) => (
							<div className="col-xl-4 col-md-6" key={idx}>
								<CareerCard key={idx} careerSingle={careerSingle} idx={idx} />
							</div>
						))
					) : !isLoading ? (
						<div className="col-12">
							<p>No open positions right now. Please check back soon.</p>
						</div>
					) : (
						""
					)}
				</div>
				{/* <!-- post pagination --> */}
				{totalPortfoliosToShow < totalPortfolios ? (
					<Paginations
						paginationDetails={{
							currentItems,
							currentpage,
							setCurrentpage,
							paginationItems,
							currentPaginationItems,
							totalPages,
							handleCurrentPage,
							firstItem,
							lastItem,
						}}
					/>
				) : (
					""
				)}
			</div>
		</section>
	);
};

export default Careers1;
