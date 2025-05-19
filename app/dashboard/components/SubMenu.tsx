import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface SubMenuProps {
    basePath: string;
    baseObject: string;
}

export default function SubMenu({ basePath, baseObject }: SubMenuProps) {
    return (
        <div className="fixed top-46 left-3 z-10 bg-white text-black shadow-md shadow-gray-500 rounded-md w-10 h-10">
            <Link
                href={`${basePath}/create`}
                aria-label={`Create ${baseObject}`}
                className="relative group w-full h-10 flex items-center justify-center cursor-pointer"
            >
                <FontAwesomeIcon icon={faPlus} className="text-lg" />
                <span className="absolute hidden group-hover:block left-1/2 transform -translate-x-1/2 top-full mt-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md shadow-md">
                    Create
                </span>
            </Link>
        </div>
    );
}