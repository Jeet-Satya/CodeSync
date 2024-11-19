import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react"; // Import components from Chakra UI for layout and styling
import { LANGUAGE_VERSIONS } from "../constants/constants"; // Import LANGUAGE_VERSIONS constant that maps programming languages to their versions

const languages = Object.entries(LANGUAGE_VERSIONS); // Convert LANGUAGE_VERSIONS object into an array of [language, version] pairs

const LanguageSelector = ({ language, onSelect }) => {
  return (
    <Box className="relative inline-block text-left mb-4">
      <Menu isLazy>
        <MenuButton
          as={Button}
          className="bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg shadow-sm px-4 py-2"
        >
          {language}
        </MenuButton>
        <MenuList className="bg-gray-800 border border-gray-600 mt-1 rounded-md shadow-lg">
          {languages.map(([lang, version]) => (
            <MenuItem
              key={lang} // Unique key for each language item
              className={`${
                lang === language
                  ? `text-indigo-300` // Apply text color for the selected item
                  : `text-gray-300`
              } hover:bg-indigo-700 hover:text-white rounded-md p-2`}
              onClick={() => onSelect(lang)} // Handle click event to select the language
              style={{
                backgroundColor: lang === language ? 'transparent' : 'inherit', // Ensure no background for selected item
                border: 'none', // Remove border for selected item
              }}
            >
              <span className={`${
                lang === language ? `font-semibold` : `font-normal`
              }`}>
                {lang}
              </span>
              <Text as="span" className="text-gray-500 text-sm">
                ({version})
              </Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default LanguageSelector; // Export the LanguageSelector component as the default export
