import {BufferGeometry, Float32BufferAttribute, Vector3} from 'three';
import {MapNodeGeometry} from './MapNodeGeometry';

// RGB Encoder Decoder
// RGB MAX MIN RANGE
//     RED_MAX,RED_MIN = 10000,200
//     GREEN_MAX,GREEN_MIN = 5000,100
//     BLUE_MAX,BLUE_MIN = 500,0 
//     correction_value = 4

const RED_MAX = 10000;
const RED_MIN = 200;
const GREEN_MAX = 5000;
const GREEN_MIN = 100;
const BLUE_MAX = 500;
const BLUE_MIN = 0;
const CORRECTION_VALUE = 0;

// def _endec(e,_max,_min,endec_flag=True):
//     if endec_flag:
//         if e >= _max:
//             enc = 0
//         elif e <= _min:
//             enc = 0
//         else:
//             enc = ((e - _min)/(_max - _min))*256
//         return enc
//     else:
//         if e >= 255:
//             val = _max
//         elif e <= 0:
//             val = 0
//         else:
//             val = ((e/256)*(_max - _min)) + _min 
//         return val

function enDec(e: number, max: number, min: number, enDecFlag = true) {
    if (enDecFlag) {
        if (e >= max) {
            return 0;
        } else if (e <= min) {
            return 0;
        }
        return ((e - min) / (max - min)) * 256;
    } else {
        if (e >= 255) {
            return max;
        } else if (e <= 0) {
            return 0;
        }
        return ((e / 256) * (max - min)) + min;
    }
}

// def _decode(r,g,b):
//     RED_MAX,RED_MIN = 10000,200
//     GREEN_MAX,GREEN_MIN = 5000,100
//     BLUE_MAX,BLUE_MIN = 500,0 
//     correction_value = 4
//     if r != 0 and g != 0 and b != 0:
//         rd,gd,bd = _endec(r,RED_MAX,RED_MIN,endec_flag=False),_endec(g,GREEN_MAX,GREEN_MIN,endec_flag=False),_endec(b,BLUE_MAX,BLUE_MIN,endec_flag=False)
//     elif r == 0 and g != 0 and b != 0:
//         rd,gd,bd = 0,_endec(g,GREEN_MAX,GREEN_MIN,endec_flag=False),_endec(b,BLUE_MAX,BLUE_MIN,endec_flag=False)
//     elif r != 0 and g == 0 and b != 0:
//         rd,gd,bd = _endec(r,RED_MAX,RED_MIN,endec_flag=False),0,_endec(b,BLUE_MAX,BLUE_MIN,endec_flag=False)
//     elif r != 0 and g != 0 and b == 0:
//         rd,gd,bd = _endec(r,RED_MAX,RED_MIN,endec_flag=False),_endec(g,GREEN_MAX,GREEN_MIN,endec_flag=False),0
//     elif r == 0 and g == 0 and b != 0:                    
//         rd,gd,bd = 0,0,_endec(b,BLUE_MAX,BLUE_MIN,endec_flag=False)
//     elif r == 0 and g != 0 and b == 0:                
//         rd,gd,bd = 0,_endec(g,GREEN_MAX,GREEN_MIN,endec_flag=False),0
//     elif r != 0 and g == 0 and b == 0:                    
//         rd,gd,bd = _endec(r,RED_MAX,RED_MIN,endec_flag=False),0,0
//     else:                    
//         rd,gd,bd = 0,0,0
//     elev = max(rd,gd,bd) + correction_value
//     return elev

function decode(r: number, g: number, b: number) {
    const rd = r === 0 ? 0 : enDec(r, RED_MAX, RED_MIN, false);
    const gd = g === 0 ? 0 : enDec(g, GREEN_MAX, GREEN_MIN, false);
    const bd = b === 0 ? 0 : enDec(b, BLUE_MAX, BLUE_MIN, false);
    return (Math.max(rd, gd, bd)) + CORRECTION_VALUE;
}

export class MapNodeHeightGeometry extends BufferGeometry
{
	/**
	 * Map node geometry constructor.
	 *
	 * @param width - Width of the node.
	 * @param height - Height of the node.
	 * @param widthSegments - Number of subdivisions along the width.
	 * @param heightSegments - Number of subdivisions along the height.
	 * @param skirt - Skirt around the plane to mask gaps between tiles.
	 */
	public constructor(width: number = 1.0, height: number = 1.0, widthSegments: number = 1.0, heightSegments: number = 1.0, skirt: boolean = false, skirtDepth: number = 10.0, imageData: ImageData | null = null, calculateNormals: boolean = true, exaggeration = 1)
	{
		super();

		// Buffers
		const indices: number[] = [];
		const vertices: number[] = [];
		const normals: number[] = [];
		const uvs: number[] = [];

		// Build plane
		MapNodeGeometry.buildPlane(width, height, widthSegments, heightSegments, indices, vertices, normals, uvs);

		const data = imageData!.data;

		for (let i = 0, j = 0; i < data.length && j < vertices.length; i += 4, j += 3) 
		{
			const r = data[i];
			const g = data[i + 1];
			const b = data[i + 2];

			// The value will be composed of the bits RGB
			// const value = (r * 65536 + g * 256 + b) * 0.1 - 1e4;
			// const value = (r * 65536 + g * 256 + b) * 0.1;
			const value = decode(r, g, b);
			// console.log(value);
			vertices[j + 1] = value * exaggeration;
			// // console.log('value =>>>>>>>>', value);
			// vertices[j + 1] = value;
		}

		// Generate the skirt
		if (skirt)
		{
			MapNodeGeometry.buildSkirt(width, height, widthSegments, heightSegments, skirtDepth, indices, vertices, normals, uvs);
		}

		this.setIndex(indices);
		this.setAttribute('position', new Float32BufferAttribute(vertices, 3));
		this.setAttribute('normal', new Float32BufferAttribute(normals, 3));
		this.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

		if (calculateNormals)
		{
			this.computeNormals(widthSegments, heightSegments);
		}
	}

	/**
	 * Compute normals for the height geometry.
	 * 
	 * Only computes normals for the surface of the map geometry. Skirts are not considered.
	 * 
	 * @param widthSegments - Number of segments in width.
	 * @param heightSegments - Number of segments in height.
	 */
	public computeNormals(widthSegments: number, heightSegments: number): void 
	{
		
		const positionAttribute = this.getAttribute('position');
	
		if (positionAttribute !== undefined)
		{
			// Reset existing normals to zero
			const normalAttribute = this.getAttribute('normal');
			const normalLength = heightSegments * widthSegments;
			for (let i = 0; i < normalLength; i++)
			{
				normalAttribute.setXYZ(i, 0, 0, 0);
			}

			const pA = new Vector3(), pB = new Vector3(), pC = new Vector3();
			const nA = new Vector3(), nB = new Vector3(), nC = new Vector3();
			const cb = new Vector3(), ab = new Vector3();
			
			const indexLength = heightSegments * widthSegments * 6;
			for (let i = 0; i < indexLength ; i += 3)
			{
				const vA = this.index!.getX(i + 0);
				const vB = this.index!.getX(i + 1);
				const vC = this.index!.getX(i + 2);

				pA.fromBufferAttribute(positionAttribute, vA);
				pB.fromBufferAttribute(positionAttribute, vB);
				pC.fromBufferAttribute(positionAttribute, vC);

				cb.subVectors(pC, pB);
				ab.subVectors(pA, pB);
				cb.cross(ab);

				nA.fromBufferAttribute(normalAttribute, vA);
				nB.fromBufferAttribute(normalAttribute, vB);
				nC.fromBufferAttribute(normalAttribute, vC);

				nA.add(cb);
				nB.add(cb);
				nC.add(cb);

				normalAttribute.setXYZ(vA, nA.x, nA.y, nA.z);
				normalAttribute.setXYZ(vB, nB.x, nB.y, nB.z);
				normalAttribute.setXYZ(vC, nC.x, nC.y, nC.z);
			}

			this.normalizeNormals();

			normalAttribute.needsUpdate = true;
		}
	}
}
