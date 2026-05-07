import { factory } from 'wasmoon';

export async function testLua() {
  const lua = await factory();
  const result = await lua.doString(`
    function add(x, y)
      return x + y
    end
    return add(2, 3)
  `);
  console.log("Lua result:", result);
}
