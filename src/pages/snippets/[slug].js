import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import ErrorPage from "next/error";
import { Fragment } from "react";

import { getPostBySlug, listAllPosts } from "@lib/api";
import markdownToHtml from "@lib/markdownToHtml";
import PostArticle from "@components/postArticle";
import BlogProgress from "@components/blogProgress";
import Heading from "@components/heading";

const RecentSnippets = dynamic(() => import("@components/sections/recentSnippets"));

const Snippet = ({ snippet, relatedSnippets }) => {
	const router = useRouter();

	if (router.isFallback) {
		return <Heading level={1}>Loading...</Heading>;
	}

	if (!router.isFallback && !snippet?.slug) {
		return <ErrorPage statusCode={404} />;
	}

	return (
		<Fragment>
			<BlogProgress />

			{/* Post */}
			<PostArticle post={snippet} />

			{/* Related Posts */}
			{!relatedSnippets.length && (
				<RecentSnippets title="Similar Snippets" posts={relatedSnippets} />
			)}
		</Fragment>
	);
};

export default Snippet;

export async function getStaticProps({ params }) {
	// Get the snippet
	const snippet = getPostBySlug({
		slug: params.slug,
		fields: [
			"title",
			"date",
			"slug",
			"author",
			"content",
			"ogImage",
			"coverImage",
			"tags",
			"excerpt",
			"type",
			"readTime",
		],
		postType: "snippets",
	});
	const content = await markdownToHtml(snippet.content || "");

	// List at most 2 related snippets
	const relatedSnippets = listAllPosts({
		fields: ["title", "date", "slug", "author", "content", "ogImage", "coverImage", "tags", "type"],
		postType: "snippets",
	})
		.filter(
			otherSnippet =>
				otherSnippet.slug !== snippet.slug &&
				otherSnippet.tags.find(tag => otherSnippet.tags.includes(tag)),
		)
		.slice(0, 3);

	return {
		props: {
			snippet: {
				...snippet,
				content,
			},
			relatedSnippets,
		},
		revalidate: 1,
	};
}

export async function getStaticPaths() {
	// List all posts' slugs
	const snippets = listAllPosts({ fields: ["slug"], postType: "snippets" });

	return {
		paths: snippets.map(snippet => {
			return {
				params: {
					slug: snippet.slug,
				},
			};
		}),
		fallback: false,
	};
}
