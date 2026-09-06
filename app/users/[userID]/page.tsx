"use client";

import { Suspense, use } from "react";

function UserContent({ params }: { params: Promise<{ userID: string }> }) {
	const { userID } = use(params);
	return <div>User ID: {userID}</div>;
}

export default function UserRoute({ params }: { params: Promise<{ userID: string }> }) {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<UserContent params={params} />
		</Suspense>
	);
}