import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faVideo } from "@fortawesome/free-solid-svg-icons";

export default function Loading() {
    return (
        <div className="flex items-center justify-center h-[calc(100vh-7rem)] w-full bg-gray-100 text-black">
            <div className="relative w-20 h-20 flex items-center justify-center">
                {/* Spinning Spinner Icon */}
                <FontAwesomeIcon
                    icon={faSpinner}
                    className="absolute text-7xl text-gray-500 animate-[spin_3s_linear_infinite]"
                />

                {/* Fading Video Icon */}
                <FontAwesomeIcon
                    icon={faVideo}
                    className="absolute text-2xl text-gray-700 opacity-100 animate-pulse"
                />
            </div>
        </div>
    );
}
