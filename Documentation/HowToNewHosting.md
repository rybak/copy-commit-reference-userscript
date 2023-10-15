## How to write a "copy commit reference" userscript for a new hosting

1. Copy `TEMPLATE.user.js` to `<hosting name>-copy-commit-reference.user.js>`
2. Implement the userscript:
   1. Replace all instances of `Example` and `example` with corresponding words
      for the new hosting.  Pay close attention to the metadata section.
   2. Use script `./maintenance/migrate-lib.sh` to migrate the new userscript
      to a fresh version of the library.
   3. Implement the new subclass of `GitHosting` using instructions in the
      library file `copy-commit-reference-lib.js`.  Use existing subclasses of
      class `GitHosting` for how various methods of class `GitHosting` can be
      overridden.
3. Test the userscript on the new hosting.
4. Insert new tests at the end of file `tests.html` using your browser.
   Follow format of the existing entries.
5. Create a screenshot of the userscript in action.  Use existing screenshots in
   directory `Documentation/` as an example.

## How to publish a new "copy commit reference" userscript

1. Merge the new userscript to branch `main`
2. Import the userscript on Greasy Fork: <https://greasyfork.org/en/import>
   using raw URL from GitHub for branch `main`
3. Set up userscript description on Greasy Fork:
   1. Go to "Admin" tab on Greasy Fork
   2. Paste `https://github.com/rybak/copy-commit-reference-userscript/raw/main/Documentation/Greasy%20Fork.md`
      into field "Default additional info"
   3. Click "Update and sync now"
4. Add the userscript to the set on Greasy Fork:
   1. Go to <https://greasyfork.org/en/users/951503-andrybak/sets/588773/edit>
   2. Paste the userscript's URL into field "Add scripts (URLs or IDs, separated by whitespace)"
   3. Click "Include" just under the field
   4. Click "Save" at the bottom of the page
5. Upload the screenshot to Greasy Fork
6. Add a new row to the table in [README.md](./README.md)
