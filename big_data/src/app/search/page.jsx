
import SearchHeader from "@/components/search/SearchHeader";
import SearchResults from "@/components/search/SearchResults";
import { getHotClustersTrending } from "@/lib/actions/news";
import { getCurrentUser } from "@/lib/auth";

export const metadata = {
    title: "Tìm kiếm - Tin tức",
    description: "Tìm kiếm tin tức",
};

export default async function SearchPage() {
    const user = await getCurrentUser();
    const hotClusters = await getHotClustersTrending(30);

    return (
        <div>
            <SearchHeader user={user} />
            <SearchResults hotClusters={hotClusters} />
        </div>
    );
}
