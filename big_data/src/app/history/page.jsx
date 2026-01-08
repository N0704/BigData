import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getUserReadHistory, getCategories } from "@/lib/actions/news";
import ReadHistoryContent from "@/components/history/ReadHistoryContent";
import Footer from "@/components/home/Footer";
import SearchHeader from "@/components/search/SearchHeader";

export default async function HistoryPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/login");
    }

    const initialHistory = await getUserReadHistory(user.id, 1, 20);

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <SearchHeader user={user} />

            <div className="grow">
                <ReadHistoryContent
                    user={user}
                    initialHistory={initialHistory}
                />
            </div>
            <Footer />
        </div>
    );
}
