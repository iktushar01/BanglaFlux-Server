import "dotenv/config";
import { seedSamplePlaylist } from "../src/app/utils/seedSamplePlaylist";

seedSamplePlaylist()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
