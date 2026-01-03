
import SearchHeader from "@/components/search/SearchHeader";
import SearchResults from "@/components/search/SearchResults";
import { getHotClustersTrending } from "@/lib/actions/news";

export const metadata = {
    title: "Tìm kiếm - Tin tức",
    description: "Tìm kiếm tin tức",
};

export default async function SearchPage() {
    const hotClusters = await getHotClustersTrending(10);

    return (
        <div>
            <SearchHeader />
            <SearchResults hotClusters={hotClusters} />
        </div>
    );
}
