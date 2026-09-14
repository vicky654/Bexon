"use client";
import ButtonPrimary from "@/components/shared/buttons/ButtonPrimary";
import TeamCard from "@/components/shared/cards/TeamCard";
import Paginations from "@/components/shared/others/Paginations";
import usePagination from "@/hooks/usePagination";
import getTeamMembers from "@/libs/getTeamMembers";

const Team1 = ({ type }) => {
	const items = getTeamMembers();
	const limit = type === 2 ? 8 : 4;
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
	const totalItems = items?.length;
	const totalItemsToShow = currentItems?.length;
	return (
		<section
			className={`${
				type === 4
					? "tj-team-section"
					: type === 2
						? "tj-team-section section-gap"
						: type === 3
							? "tj-team-section-3 section-gap section-gap-x"
							: "tj-team-section section-separator"
			}`}
		>
			<div className="container">
				{type === 2 ? (
					""
				) : (
					<div className="row">
						<div className="col-12">
							<div
								className={`sec-heading text-center  ${
									type === 4 ? "style-2 style-7" : type === 3 ? "" : "style-2"
								}`}
							>
								<span className="sub-title wow fadeInUp" data-wow-delay=".3s">
									{type === 3 || type === 4 ? <i className="tji-box"></i> : ""}
									Meet Our Team
								</span>
								{type === 4 ? (
									<h2 className="sec-title title-anim">People Behind Bexon.</h2>
								) : type === 3 ? (
									<h2 className="sec-title title-anim">
										Success <span>Stories</span> Fuel our Innovation.
									</h2>
								) : (
									<h2
										className={`sec-title ${
											type === 2 ? "title-anim" : "text-anim"
										}`}
									>
										People Behind <span>Bexon.</span>
									</h2>
								)}
							</div>
						</div>
					</div>
				)}

				<div className="row leftSwipeWrap">
					{currentItems?.length
						? currentItems.map((item, idx) => (
								<div key={idx} className="col-lg-3 col-sm-6">
									<TeamCard teamMember={item} />
								</div>
							))
						: ""}
				</div>
				{type === 2 ? (
					""
				) : (
					<div
						className="team-btn d-md-none mt-40 text-center wow fadeInUp"
						data-wow-delay="0.9s"
					>
						<ButtonPrimary text={"More member"} url={"/team"} />
					</div>
				)}
				{type === 2 && totalItemsToShow < totalItems ? (
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

export default Team1;
