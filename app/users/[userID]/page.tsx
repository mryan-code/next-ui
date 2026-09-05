"use client";
export default function UserRoute({ params }: { params: { userID: string } }) {
	return <div>User ID: {params.userID}</div>;
}