import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faVideoSlash } from "@fortawesome/free-solid-svg-icons";

export default function NoDataElement() {
    return (
        <div>
            {/* Icons Container (h-32 for consistency) */}
            <div className="flex items-center justify-center h-32 w-full bg-gray-100 text-black">
                <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Static Spinner Icon */}
                    <FontAwesomeIcon
                        icon={faSpinner}
                        className="absolute text-7xl text-gray-500"
                    />

                    {/* Static Video Icon */}
                    <FontAwesomeIcon
                        icon={faVideoSlash}
                        className="absolute text-2xl text-gray-700"
                    />
                </div>
            </div>

            <div className="flex items-center justify-center mt-4 text-lg text-black">
                Reel is Empty!
            </div>
        </div>
    );
}
